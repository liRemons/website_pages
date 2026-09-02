const express = require("express");
const path = require('path');
const app = express();
const fs = require('fs');
const port = 8080;

// 是否启用服务端OGP动态注入（为docList页面注入文章标题到OGP标签）
const ENABLE_OGP_INJECTION = true;

// API服务器地址（用于获取文章信息），可通过环境变量配置
const API_BASE_URL = process.env.API_BASE_URL || '';

// HTML特殊字符转义
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 替换HTML中的OGP标签
function replaceOGPTags(html, title) {
  // 替换 <title> 标签
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  
  // 替换 og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/i,
    `<meta property="og:title" content="${escapeHtml(title)}"`
  );
  
  // 替换 twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}"`
  );

  return html;
}

// 服务端OGP动态注入中间件（在静态文件服务之前）
app.use(async (req, res, next) => {
  // 开关关闭时，直接走后续静态文件服务
  if (!ENABLE_OGP_INJECTION) {
    return next();
  }

  // 只处理 docList 页面的 HTML 请求
  if (!req.path.startsWith('/@website_pages/docList')) {
    return next();
  }

  // 获取 pageId 或 id 参数
  const pageId = req.query.pageId || '';
  const id = req.query.id || '';
  
  // 没有参数，直接走静态文件服务
  if (!pageId && !id) {
    return next();
  }

  try {
    // 调用 API 获取文章信息
    const apiUrl = `${API_BASE_URL}/ogp/article-info?pageId=${encodeURIComponent(pageId)}&id=${encodeURIComponent(id)}`;
    const response = await fetch(apiUrl, {
      // 忽略 SSL 证书验证（本地开发环境）
      // @ts-ignore
      agent: new (require('https').Agent)({ rejectUnauthorized: false }),
    });
    
    if (!response.ok) {
      return next();
    }
    
    const result = await response.json();
    
    // 没有文章信息，走静态文件服务
    if (!result.data || !result.data.title) {
      return next();
    }

    const articleTitle = result.data.title;
    
    // 读取静态HTML文件
    const htmlPath = path.join(__dirname, 'dist/@website_pages/docList/index.html');
    if (!fs.existsSync(htmlPath)) {
      return next();
    }

    let html = fs.readFileSync(htmlPath, 'utf-8');
    
    // 替换OGP标签
    html = replaceOGPTags(html, articleTitle);

    // 返回修改后的HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('OGP injection error:', error);
    // 出错时走静态文件服务
    next();
  }
});

// 优先返回预压缩文件（br > gz），无需运行时压缩，性能更好
// brotli 压缩率比 gzip 高 15%-25%，现代浏览器均支持
const mimeMap = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
};

app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const originalExt = path.extname(req.path);
  
  if (!mimeMap[originalExt]) return next();
  // br 优先
  if (acceptEncoding.includes('br')) {
    const brPath = path.join(__dirname, 'dist', req.path + '.br');
    if (fs.existsSync(brPath)) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Type', mimeMap[originalExt]);
      res.setHeader('Vary', 'Accept-Encoding');
      req.url = req.url + '.br';
      return next();
    }
  }

  // gzip 兜底
  if (acceptEncoding.includes('gzip')) {
    const gzPath = path.join(__dirname, 'dist', req.path + '.gz');
    if (fs.existsSync(gzPath)) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', mimeMap[originalExt]);
      res.setHeader('Vary', 'Accept-Encoding');
      req.url = req.url + '.gz';
      return next();
    }
  }

  next();
});

// 带 contenthash 的 JS/CSS 文件内容变了文件名就变，可以设置超长缓存（1年）
// HTML 不能缓存，否则用户拿不到最新的 script 引用
// app.use(express.static("dist", { maxAge: 1000 * 3600 }));
app.use(express.static("dist", {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (ext === '.html') {
      // HTML 不缓存，每次都去服务器拿最新版本
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (['.js', '.css', '.woff', '.woff2', '.ttf', '.svg', '.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
      // 带 hash 的静态资源，缓存 1 年
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.get('/', (req, res) => {
  // res.sendFile(path.resolve(__dirname, './dist/@website_pages/home/index.html'))
  res.sendFile(path.resolve(__dirname, './dist/@website_pages/tool/index.html'))
})

app.listen(port, () => console.log(`Example app listening on port port!`));


