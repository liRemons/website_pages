const { Compilation, sources } = require('webpack');

/**
 * 自定义插件：收集 HtmlWebpackPlugin 注入的资源信息，生成 index.js 入口加载器
 * index.js 负责动态创建 script/link 元素加载所有依赖（CDN externals + webpack chunks）
 */
class InjectEntryLoaderPlugin {
  constructor(options = {}) {
    this.options = {
      injectEntry: options.injectEntry !== false,
      publicPath: options.publicPath || '/',
    };
  }

  apply(compiler) {
    // 从 webpack entry 配置获取页面名
    let pageNames = [];
    compiler.hooks.compilation.tap('InjectEntryLoaderPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'InjectEntryLoaderPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          const publicPath = compilation.outputOptions.publicPath || '/';
          const pageAssetsMap = new Map();
          // 从 webpack entry 配置获取页面名（不包含 HtmlWebpackPlugin 的 HTML 入口）
          const entryKeys = typeof compiler.options.entry === 'function'
            ? Object.keys(compilation.name ? compilation.options.entry : {})
            : Object.keys(typeof compiler.options.entry === 'object' ? compiler.options.entry : {});
          // 获取 HtmlWebpackPlugin 配置中的 filename 来匹配入口名
          const htmlPluginMap = new Map();
          for (const plugin of (compiler.options.plugins || [])) {
            if (plugin.constructor.name === 'HtmlWebpackPlugin') {
              const chunks = plugin.userOptions.chunks || [];
              chunks.forEach(chunk => {
                const filename = plugin.userOptions.filename || '';
                const pageDir = filename.replace(/\/index\.html$/, '');
                htmlPluginMap.set(chunk, pageDir);
              });
            }
          }

          // 从 entrypoints 获取 chunks
          const allEntries = [...compilation.entrypoints.entries()];
          for (const [name, entrypoint] of allEntries) {
            if (name === 'runtime') continue;
            // 过滤掉 HtmlWebpackPlugin 生成的 HTML 入口（只有 HTML 文件，没有 JS/CSS）
            const files = entrypoint.getFiles ? [...entrypoint.getFiles()] : [];
            if (!files.some(f => f.endsWith('.js'))) continue;

            const jsFiles = [];
            const cssFiles = [];
            
            files.forEach((file) => {
              if (file.endsWith('.js')) jsFiles.push(file);
              if (file.endsWith('.css')) cssFiles.push(file);
            });

            // 从 compiler.options.externals 获取 CDN externals（webpack 5 兼容方式）
            const cdnJs = [];
            const cdnCss = [];
            const externalsValues = [];

            // externals 配置：{ react: 'React', 'react-dom': 'ReactDOM', ... }
            const externalsConfig = compiler.options.externals || {};
            if (typeof externalsConfig === 'object') {
              externalsValues.push(...Object.keys(externalsConfig));
            }

            // 从 config/cdn.js 获取 CDN 配置
            const { js: cdnJsConfig, css: cdnCssConfig } = require('../config/cdn');

            cdnJsConfig.forEach((item) => {
              if (externalsValues.includes(item.externalsName)) {
                cdnJs.push(item.url);
              }
            });

            cdnCssConfig.forEach((item) => {
              if (externalsValues.includes(item.externalsName)) {
                cdnCss.push(item.url);
              }
            });

            pageAssetsMap.set(name, {
              localJs: [...new Set(jsFiles)],
              localCss: [...new Set(cssFiles)],
              cdnJs: [...new Set(cdnJs)],
              cdnCss: [...new Set(cdnCss)],
            });
          }

          // 为每个页面生成 index.js 入口文件
          for (const [pageName, assets] of pageAssetsMap.entries()) {
            const jsCode = this.generateLoaderCode({
              pageName,
              localJs: assets.localJs,
              localCss: assets.localCss,
              cdnJs: assets.cdnJs,
              cdnCss: assets.cdnCss,
              publicPath,
            });

            const entryFile = `${pageName}/index.js`;
            compilation.emitAsset(entryFile, new sources.RawSource(jsCode));
          }
        }
      );
    });
  }

  generateLoaderCode({ pageName, localJs, localCss, cdnJs, cdnCss, publicPath }) {
    const resolvePath = (url) => {
      if (url.startsWith('http')) return url;
      return `${publicPath}${url}`;
    };

    return `
(function() {
  "use strict";

  var publicPath = ${JSON.stringify(publicPath)};
  var loadingCount = 0;
  var loaded = 0;

  function resolvePath(url) {
    if (url.startsWith('http')) return url;
    var base = typeof window.__PUBLIC_PATH_OVERRIDE__ !== 'undefined'
      ? window.__PUBLIC_PATH_OVERRIDE__
      : publicPath;
    return base + url;
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = resolvePath(src);
      script.defer = true;
      script.onload = resolve;
      script.onerror = function() { reject(new Error('Failed to load script: ' + src)); };
      document.head.appendChild(script);
    });
  }

  function loadCSS(href) {
    return new Promise(function(resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resolvePath(href);
      link.onload = resolve;
      link.onerror = function() { reject(new Error('Failed to load CSS: ' + href)); };
      document.head.appendChild(link);
    });
  }

  var scripts = ${JSON.stringify(localJs, null, 2)};
  var styles = ${JSON.stringify(localCss, null, 2)};
  var cdnScripts = ${JSON.stringify(cdnJs, null, 2)};
  var cdnStyles = ${JSON.stringify(cdnCss, null, 2)};

  // 先加载 CSS，再按顺序加载 CDN JS，最后加载页面 JS
  Promise.all([
    Promise.all(cdnStyles.map(function(h) { return loadCSS(h); })),
    Promise.all(styles.map(function(h) { return loadCSS(h); }))
  ]).then(function() {
    // CDN scripts 必须按顺序加载（React -> ReactDOM -> mobx -> ...）
    return cdnScripts.reduce(function(promise, src) {
      return promise.then(function() { return loadScript(src); });
    }, Promise.resolve());
  }).then(function() {
    return Promise.all(scripts.map(function(s) { return loadScript(s); }));
  }).then(function() {
    console.log('[${pageName}] All resources loaded successfully');
  }).catch(function(err) {
    console.error('[${pageName}] Failed to load resources:', err);
  });
})();
`.trim();
  }
}

module.exports = InjectEntryLoaderPlugin;