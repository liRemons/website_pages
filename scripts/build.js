const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { getPages, getDist } = require('./common');
const chalk = require('./chalk');
const pakeageJSON = require('../package.json');

// Windows 下 .bin/ 下的符号链接无法直接执行，需使用 .cmd 后缀
const WEBPACK_BIN = process.platform === 'win32'
  ? path.resolve(__dirname, '../node_modules/.bin/webpack.cmd')
  : path.resolve(__dirname, '../node_modules/.bin/webpack');
const PERCENT_RE = /\[webpack\.Progress\]\s*(\d+)%/;
const NOISE_LINE_RE = /^<[siw]>\s*\[webpack\./;
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// 判断终端是否支持 ANSI 光标控制（上移覆写）
// Windows CMD/PowerShell 即使 isTTY=true，也不支持 \x1b[nA 光标上移
// Windows Terminal（WT_SESSION）和 ConEmu（ConEmuANSI=ON）支持完整 ANSI
const isWindowsAnsiSupported =
  process.platform === 'win32' &&
  (!!process.env.WT_SESSION || process.env.ConEmuANSI === 'ON' || !!process.env.TERM_PROGRAM);
const isTTY = !!process.stdout.isTTY && (process.platform !== 'win32' || isWindowsAnsiSupported);

// 进度数据：key=pageName, value={ percent, status }
const progressMap = {};
// 有序页面列表，用于整块重绘（初始化时赋值）
let pageListOrdered = [];
// TTY 打包过程中缓存的错误信息，打包全部结束后统一输出，避免干扰进度条
const pendingStderr = [];

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function buildBar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
}

function buildPageLine(page, percent, status, spinFrame) {
  const spin = SPINNER[spinFrame % SPINNER.length];
  if (status === 'done') {
    return `  ${chalk.green('✓')} ${chalk.green(page.padEnd(18))} ${buildBar(100)} 100%`;
  }
  if (status === 'error') {
    return `  ${chalk.red('✗')} ${chalk.red(page.padEnd(18))} ${buildBar(percent)} ${String(percent).padStart(3)}%`;
  }
  return `  ${chalk.cyan(spin)} ${chalk.cyan(page.padEnd(18))} ${buildBar(percent)} ${String(percent).padStart(3)}%`;
}

/**
 * TTY 模式下整块重绘所有进度行。
 * 上移到进度区域顶部后逐行覆写，完全不依赖相对光标位置，
 * 任何外部 stdout/stderr 输出都不会导致行号偏移。
 */
function redrawAllLines(spinFrame) {
  if (!isTTY || pageListOrdered.length === 0) return;
  const n = pageListOrdered.length;
  let out = `\x1b[${n}A`; // 上移到进度区域第一行
  pageListOrdered.forEach((page) => {
    const { percent, status } = progressMap[page];
    out += '\r\x1b[2K' + buildPageLine(page, percent, status, spinFrame) + '\n';
  });
  process.stdout.write(out);
}

// ─── dist 目录路径工具 ─────────────────────────────────────────────────────────

const DIST_BASE = path.resolve(__dirname, `../dist/@${pakeageJSON.name}`);

function pageDistDir(page) {
  return path.join(DIST_BASE, page);
}

function pageBackupDir(page) {
  return path.join(DIST_BASE, `_bak_${page}`);
}

/**
 * 打包前：把旧正式目录 rename 到备份目录（近似原子操作，线上服务不中断）。
 * 如果正式目录不存在则跳过。
 */
function backupPageDist(page) {
  const distDir = pageDistDir(page);
  const bakDir = pageBackupDir(page);
  // 清理上次可能残留的备份
  if (fs.existsSync(bakDir)) {
    fs.rmSync(bakDir, { recursive: true, force: true });
  }
  if (fs.existsSync(distDir)) {
    fs.renameSync(distDir, bakDir);
  }
}

/**
 * 打包成功后：删除备份目录（旧产物已无用）。
 */
function removePageBackup(page) {
  const bakDir = pageBackupDir(page);
  if (fs.existsSync(bakDir)) {
    fs.rmSync(bakDir, { recursive: true, force: true });
  }
}

/**
 * 打包失败后：删除不完整的新产物，把备份 rename 回正式目录恢复旧版本。
 */
function restorePageDist(page) {
  const distDir = pageDistDir(page);
  const bakDir = pageBackupDir(page);
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  if (fs.existsSync(bakDir)) {
    fs.renameSync(bakDir, distDir);
  }
}

/**
 * 清理 DIST_BASE 根目录下的 _bak_ 备份目录（打包异常中断时可能残留）。
 * 数字 chunk 目录、assets 等均为 webpack 合法产物，不做删除。
 */
function cleanLegacyDistDirs() {
  if (!fs.existsSync(DIST_BASE)) return;
  const entries = fs.readdirSync(DIST_BASE, { withFileTypes: true });
  entries.forEach((entry) => {
    if (!entry.isDirectory()) return;
    if (entry.name.startsWith('_bak_')) {
      fs.rmSync(path.join(DIST_BASE, entry.name), { recursive: true, force: true });
    }
  });
}

// ─── 单页面打包 ────────────────────────────────────────────────────────────────

// 单页最长打包时间（毫秒），超时后强制 kill 子进程，可通过 BUILD_TIMEOUT 环境变量覆盖
const PAGE_BUILD_TIMEOUT_MS = parseInt(process.env.BUILD_TIMEOUT || '300000', 10); // 默认 5 分钟

function buildPage(page, otherParams, spinFrameRef) {
  // 打包前把旧产物备份，确保打包期间线上页面仍可访问旧版本
  backupPageDist(page);

  return new Promise((resolve, reject) => {
    const child = spawn(WEBPACK_BIN, [
      '--mode=production',
      '--progress',
      '--env', `pages=${page}`,
      '--env', `otherParams=${otherParams}`,
    ], { stdio: 'pipe', shell: process.platform === 'win32' });

    // 超时保护：检测进度值是否停滞，而非仅检测是否有输出
    // webpack 卡死时 --progress 仍会持续输出相同百分比，lastActivityAt 会一直刷新
    // 所以必须用"进度值上次变化时间"来判断是否真正卡住
    let lastPercent = -1;
    let lastProgressChangedAt = Date.now();
    const timeoutTimer = setInterval(() => {
      const currentPercent = progressMap[page].percent;
      if (currentPercent !== lastPercent) {
        // 进度有变化，重置计时
        lastPercent = currentPercent;
        lastProgressChangedAt = Date.now();
        return;
      }
      if (Date.now() - lastProgressChangedAt >= PAGE_BUILD_TIMEOUT_MS) {
        clearInterval(timeoutTimer);
        progressMap[page].status = 'error';
        restorePageDist(page);
        pendingStderr.push(chalk.red(`  [${page}] ⏰ 打包超时（进度停滞在 ${currentPercent}% 超过 ${PAGE_BUILD_TIMEOUT_MS / 1000}s），已强制终止`));
        child.kill('SIGKILL');
        reject(new Error(`[${page}] 打包超时`));
      }
    }, 5000);

    // stdout：stats=errors-only 时正常构建无输出，出错才有内容，全部缓存到 pendingStderr
    let stdoutBuf = '';
    child.stdout.on('data', (chunk) => {
      lastActivityAt = Date.now();
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop();
      lines.forEach((line) => {
        if (line.trim()) {
          pendingStderr.push(chalk.red(`  [${page}] `) + line.trim());
        }
      });
    });

    // stderr：只提取 --progress 百分比，其余噪音过滤或缓存
    let stderrBuf = '';
    child.stderr.on('data', (chunk) => {
      lastActivityAt = Date.now();
      stderrBuf += chunk.toString();
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop();
      lines.forEach((line) => {
        if (!line.trim()) return;
        const m = line.match(PERCENT_RE);
        if (m) {
          progressMap[page].percent = parseInt(m[1], 10);
          return;
        }
        if (NOISE_LINE_RE.test(line)) return;
        if (/Browserslist|update-browserslist-db|browserslist/.test(line)) return;
        if (/^\s*\[.+\]\s*cdn\//.test(line)) return;
        // TTY 模式下缓存错误信息，避免输出到终端打乱进度条；非 TTY 直接输出
        if (isTTY) {
          pendingStderr.push(chalk.red(`  [${page}] `) + line.trim());
        } else {
          process.stderr.write(chalk.red(`  [${page}] `) + line.trim() + '\n');
        }
      });
    });

    child.on('error', (err) => {
      clearInterval(timeoutTimer);
      progressMap[page].status = 'error';
      pendingStderr.push(chalk.red(`\n  [${page}] 启动失败: ${err.message}`));
      reject(err);
    });

    child.on('close', (code, signal) => {
      clearInterval(timeoutTimer);
      if (code === 0) {
        progressMap[page].percent = 100;
        progressMap[page].status = 'done';
        removePageBackup(page);
        cleanLegacyDistDirs();
        if (!isTTY) console.log(`[${page}] ✅ 打包完成`);
        resolve(page);
      } else {
        progressMap[page].status = 'error';
        restorePageDist(page);
        let errorMsg = `退出码: ${code}`;
        if (signal) errorMsg = `被信号终止: ${signal}`;
        else if (code === null) errorMsg = `进程未正常启动 (code=null)`;
        pendingStderr.push(chalk.red(`  [${page}] ❌ ${errorMsg}`));
        if (!isTTY) console.log(`[${page}] ❌ ${errorMsg}`);
        reject(new Error(`[${page}] ${errorMsg}`));
      }
    });
  });
}

// ─── 限并发执行 ────────────────────────────────────────────────────────────────

/**
 * 限制并发数地执行任务队列，返回所有任务结果（保持顺序）。
 * 任意任务失败时，等待当前运行中的任务完成后 reject。
 */
function runWithConcurrency(items, concurrency, taskFn) {
  return new Promise((resolve, reject) => {
    const results = [];
    let nextIndex = 0;
    let activeCount = 0;
    let hasError = false;

    function startNext() {
      if (hasError || nextIndex >= items.length) return;

      const currentIndex = nextIndex++;
      const item = items[currentIndex];
      activeCount++;

      taskFn(item)
        .then((result) => {
          results[currentIndex] = result;
          activeCount--;
          if (hasError) return;
          if (nextIndex < items.length) {
            startNext();
          } else if (activeCount === 0) {
            resolve(results);
          }
        })
        .catch((err) => {
          activeCount--;
          if (!hasError) {
            hasError = true;
            reject(err);
          }
        });
    }

    // 初始启动最多 concurrency 个任务
    const initialBatch = Math.min(concurrency, items.length);
    for (let i = 0; i < initialBatch; i++) {
      startNext();
    }
  });
}

// ─── 入口 ─────────────────────────────────────────────────────────────────────

getPages().then(({ pages, otherParams }) => {
  // otherParams 是数组（来自 process.argv.slice），统一转成字符串使用
  const otherParamsStr = Array.isArray(otherParams) ? otherParams.join(',') : (otherParams || '');

  if (otherParamsStr.includes('report=true')) {
    execSync(`${WEBPACK_BIN} --mode=production --env pages=${pages} --env otherParams=${otherParamsStr}`, { stdio: 'inherit' });
    getDist();
    return;
  }

  const pageList = pages.split(',');
  console.log(chalk.bold(`\n🚀 并行打包 ${chalk.cyan(pageList.length)} 个应用：${chalk.cyan(pageList.join('、'))}\n`));

  // 初始化进度数据，赋值有序列表供整块重绘使用
  pageListOrdered = pageList;
  pageList.forEach((page) => {
    progressMap[page] = { percent: 0, status: 'building' };
  });

  // 从 otherParams 中解析 concurrency=N，默认并发数为 2，避免多进程同时启动导致内存溢出
  const concurrencyMatch = otherParamsStr.match(/concurrency=(\d+)/);
  const concurrency = concurrencyMatch ? Math.max(1, parseInt(concurrencyMatch[1], 10)) : 1;
  if (concurrency < pageList.length) {
    console.log(chalk.gray(`  并发限制: ${concurrency}（其余页面排队等待，可通过 concurrency=N 调整）`));
  }

  // TTY：打印初始占位行（每应用一行），后续用整块重绘覆写，不依赖相对光标偏移
  const spinFrameRef = { frame: 0 };
  if (isTTY) {
    pageList.forEach((page) => {
      process.stdout.write(buildPageLine(page, 0, 'building', 0) + '\n');
    });
    // 定时器驱动 spinner + 整块重绘，保证进度条始终在正确位置
    setInterval(() => {
      spinFrameRef.frame++;
      redrawAllLines(spinFrameRef.frame);
    }, 100).unref();
  }

  const startTime = Date.now();

  runWithConcurrency(pageList, concurrency, (page) => buildPage(page, otherParamsStr, spinFrameRef))
    .then((done) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      // 输出缓存的错误/警告信息
      if (pendingStderr.length > 0) {
        process.stderr.write(pendingStderr.join('\n') + '\n');
      }
      console.log(chalk.green(chalk.bold(`\n✅ 全部完成，耗时 ${elapsed}s\n`)));
      cleanLegacyDistDirs();
      getDist(done);
    })
    .catch((err) => {
      if (pendingStderr.length > 0) {
        process.stderr.write(pendingStderr.join('\n') + '\n');
      }
      console.error(chalk.red(`\n❌ ${err.message}`));
      process.exit(1);
    });
})

