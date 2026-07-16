const express = require("express");
const path = require('path');
const app = express();
const fs = require('fs');
const port = 8080;

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
  console.log(acceptEncoding, acceptEncoding.includes('br'), 'acceptEncoding===');
  const originalExt = path.extname(req.path);
  console.log(originalExt, req.path, 'originalExt==');
  
  // if (!mimeMap[originalExt]) return next();
  // br 优先
  if (acceptEncoding.includes('br')) {
    console.log('br====start')
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


