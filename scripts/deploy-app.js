const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("./chalk");
const pagesJSON = require("./pages.json");
const DIST_BASE = path.resolve(__dirname, '../dist');
const HBUILDER_DIR = path.resolve(__dirname, '../hbuilder');
const SRC_DIR = path.resolve(__dirname, '../src');
const ROOT_MANIFEST = path.resolve(__dirname, '../manifest.json');
const APP_TEMPLATE = path.resolve(__dirname, '../src/index-app.html');

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
    const pagePublicPath = 'https://remons.cn/'
    // 所以 publicPath 必须是 ../（写成 ./ 会解析成 docList/docList/... 导致 404 白屏）
    const otherParams = `pagePublicPath=${pagePublicPath},br=false,gzip=false`;

    console.log(chalk.bold(`\n📱 开始 App 打包（页面数: ${pagesJSON.length}）\n`));
    console.log(chalk.cyan(`   publicPath: ${pagePublicPath} （相对路径）`));
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
 * 步骤 2: 仅拷贝各页面的 index.html 到 hbuilder 目录
 * 同时将入口 JS 路径替换为线上 URL 以支持在线更新
 */
const ONLINE_BASE = 'https://remons.cn';

function copyDistToHbuilder() {
  return new Promise((resolve, reject) => {
    try {
      fs.ensureDirSync(HBUILDER_DIR);

      // 清空 hbuilder 下的旧页面产物（保留 .hbuilderx, unpackage, assets）
      const entries = fs.readdirSync(HBUILDER_DIR, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = path.join(HBUILDER_DIR, entry.name);
        if (['.hbuilderx', 'unpackage', 'assets', 'static'].includes(entry.name)) return;
        fs.removeSync(fullPath);
      });

      // 仅拷贝每个页面的 index.html，入口 JS 走线上地址
      const copiedPages = [];
      pagesJSON.forEach((p) => {
        const srcHtml = path.join(DIST_BASE, p.pageName, 'index.html');
        if (!fs.existsSync(srcHtml)) return;

        let html = fs.readFileSync(srcHtml, 'utf-8');

        // 替换入口 index.js：/pageName/index.js -> https://remons.cn/pageName/index.js
        const oldSrc = `src="/${p.pageName}/index.js"`;
        const newSrc = `src="${ONLINE_BASE}/${p.pageName}/index.js"`;
        html = html.replace(oldSrc, newSrc);

        // 注入 publicPath 修正脚本，让线上 index.js 的资源从线上 CDN 加载
        // (InjectEntryLoaderPlugin 在 resolvePath 中检查 window.__PUBLIC_PATH_OVERRIDE__)
        const overrideScript = `<script>window.__PUBLIC_PATH_OVERRIDE__ = '${ONLINE_BASE}/';<\/script>`;
        // 注入 app-pages.js（App 模式下页面路由信息）
        const appPagesScript = `<script src="../utils/app-pages.js"><\/script>`;
        html = html.replace('</head>', overrideScript + '\n  ' + appPagesScript + '\n  </head>');

        // 写入 hbuilder/pageName/index.html
        const destDir = path.join(HBUILDER_DIR, p.pageName);
        fs.ensureDirSync(destDir);
        fs.writeFileSync(path.join(destDir, 'index.html'), html);
        copiedPages.push(p.pageName);
      });

      console.log(chalk.cyan(`   拷贝 ${copiedPages.length} 个页面的 index.html 到 hbuilder/`));
      console.log(chalk.cyan(`   入口 JS 已替换为线上地址: ${ONLINE_BASE}/`));

      // 从根目录复制 manifest.json 到 hbuilder 目录
      if (fs.existsSync(ROOT_MANIFEST)) {
        const destManifest = path.join(HBUILDER_DIR, 'manifest.json');
        fs.copyFileSync(ROOT_MANIFEST, destManifest);
        console.log(chalk.cyan('   拷贝 manifest.json 到 hbuilder/'));
      }

      // 复制 app-pages.js 到 hbuilder/utils/
      var appPagesSrc = path.resolve(__dirname, '../src/utils/app-pages.js');
      if (fs.existsSync(appPagesSrc)) {
        var appPagesDest = path.join(HBUILDER_DIR, 'utils', 'app-pages.js');
        fs.ensureDirSync(path.dirname(appPagesDest));
        fs.copyFileSync(appPagesSrc, appPagesDest);
        console.log(chalk.cyan('   拷贝 utils/app-pages.js 到 hbuilder/'));
      }

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

    // 从 src/index-app.html 读取模板并注入页面数据
    const templatePath = APP_TEMPLATE;
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // 替换 pagesList 数组内容 (支持多种格式)
    // 格式 1: var pagesList = __PAGES_JSON__;
    if (html.includes('__PAGES_JSON__')) {
      html = html.replace('__PAGES_JSON__', pagesJSONStr);
    } 
    // 格式 2: var pagesList = [...existing array...];
    else {
      html = html.replace(/var pagesList = \[[\s\S]*?\];/, `var pagesList = ${pagesJSONStr};`);
    }

    // 写入到 hbuilder/index.html
    const outputPath = path.join(HBUILDER_DIR, 'index.html');
    fs.writeFileSync(outputPath, html);
    console.log(chalk.cyan(`   注入 ${pagesData.length} 个页面路由到 hbuilder/index.html`));
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