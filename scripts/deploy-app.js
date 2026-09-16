const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("./chalk");
const pagesJSON = require("./pages.json");
const packageJSON = require("../package.json");

const DIST_BASE = path.resolve(__dirname, '../dist');
const HBUILDER_DIR = path.resolve(__dirname, '../hbuilder');

// 获取 webpack 二进制路径
const WEBPACK_BIN = process.platform === 'win32'
  ? path.resolve(__dirname, '../node_modules/.bin/webpack.cmd')
  : path.resolve(__dirname, '../node_modules/.bin/webpack');

/**
 * 步骤 1: 使用相对 publicPath 打包所有页面
 */
function buildAllPages() {
  return new Promise((resolve, reject) => {
    const pageNames = pagesJSON.map(p => p.pageName).join(',');
    // 使用相对路径，关闭 brotli 压缩（App 不需要）
    // 参数分隔符必须用 ,（与 webpack.config.js 的 split(',') 一致）
    // 注意：产物文件名规则是 [name]/js/xxx.js，已带页面目录前缀；
    // 而 index.html 就在页面目录内（docList/index.html），引用需再上一级，
    // 所以 publicPath 必须是 ../（写成 ./ 会解析成 docList/docList/... 导致 404 白屏）
    const otherParams = 'pagePublicPath=../,br=false,gzip=false';

    console.log(chalk.bold(`\n📱 开始 App 打包（页面数: ${pagesJSON.length}）\n`));
    console.log(chalk.cyan(`   publicPath: ../ （相对路径）`));
    console.log(chalk.cyan(`   brotli: 关闭`));
    console.log(chalk.cyan(`   gzip: 关闭\n`));

    const child = spawn(WEBPACK_BIN, [
      '--mode=production',
      '--env', `pages=${pageNames}`,
      '--env', `otherParams=${otherParams}`,
    ], { stdio: 'inherit', shell: process.platform === 'win32' });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✅ 所有页面打包完成\n'));
        resolve();
      } else {
        console.log(chalk.red('\n� 打包失败\n'));
        reject(new Error('打包失败'));
      }
    });
  });
}

/**
 * 步骤 2: 拷贝 dist 资源到 hbuilder 目录
 */
function copyDistToHbuilder() {
  return new Promise((resolve, reject) => {
    try {
      // 清空 hbuilder 下的旧产物（保留 manifest.json 和 index.html 模板）
      const entries = fs.readdirSync(HBUILDER_DIR, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = path.join(HBUILDER_DIR, entry.name);
        if (entry.name === 'manifest.json' || entry.name === 'index.html') return;
        fs.removeSync(fullPath);
      });

      // 将整个 dist/ 拷贝到 hbuilder/
      console.log(chalk.cyan('   拷贝 dist/ 资源到 hbuilder/'));
      fs.copySync(DIST_BASE, HBUILDER_DIR, {
        filter: (src) => {
          // 保留 manifest.json 和 index.html
          const rel = path.relative(HBUILDER_DIR, src);
          return rel !== 'manifest.json' && rel !== 'index.html';
        }
      });

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 步骤 3: 生成页面路由信息，注入到 index.html
 */
function generatePagesJSON() {
  return new Promise((resolve) => {
    const pagesArr = pagesJSON.filter(p => {
      // 只包含已打包的页面（跳过 home/homeList/login 等非功能页面，如果不需要的话）
      const distPageDir = path.join(DIST_BASE, p.pageName, 'index.html');
      return fs.existsSync(distPageDir);
    });

    // 生成 JSON 数据，格式化为 JavaScript 数组
    const pagesData = pagesArr.map(p => ({
      name: p.pageName,
      title: p.title,
      subTitle: p.subTitle || '',
      path: `${p.pageName}/index.html`
    }));

    const pagesJSONStr = JSON.stringify(pagesData, null, 4);

    // 读取 index.html 模板并注入页面数据
    const templatePath = path.join(HBUILDER_DIR, 'index.html');
    let html = fs.readFileSync(templatePath, 'utf-8');
    html = html.replace('__PAGES_JSON__', pagesJSONStr);

    fs.writeFileSync(templatePath, html);
    console.log(chalk.cyan(`   注入 ${pagesData.length} 个页面路由到 index.html`));
    resolve();
  });
}

/**
 * 主入口
 */
async function main() {
  try {
    await buildAllPages();
    await copyDistToHbuilder();
    await generatePagesJSON();
    console.log(chalk.bold(chalk.green(`\n✅ App 资源准备完成！\n`)));
    console.log(chalk.cyan(`   使用 HBuilderX 打开 hbuilder/ 目录`));
    console.log(chalk.cyan(`   菜单 → 发行 → 原生App-云打包\n`));
  } catch (err) {
    console.error(chalk.red(`\n❌ 错误: ${err.message}\n`));
    process.exit(1);
  }
}

main();