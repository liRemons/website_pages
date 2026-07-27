# 配置信息

## 依赖

### devDependencies
| 包名 | 版本 | 用途 |
|------|------|------|
| webpack | ^5.108.4 | 构建工具核心 |
| webpack-cli | ^4.7.2 | Webpack 命令行 |
| webpack-dev-server | ^4.9.0 | 开发服务器 |
| esbuild-loader | ^4.5.0 | JS/TSX 编译器（替代 babel-loader） |
| less | ^4.1.1 | CSS 预处理器 |
| less-loader | ^10.0.1 | Less Webpack loader |
| css-loader | ^5.2.6 | CSS loader |
| style-loader | ^3.0.0 | CSS 注入（开发环境） |
| mini-css-extract-plugin | ^2.1.0 | CSS 提取插件（生产环境） |
| postcss | ^8.3.5 | CSS 后处理 |
| postcss-loader | ^6.1.1 | PostCSS Webpack loader |
| postcss-preset-env | ^6.7.0 | PostCSS 预设 |
| terser-webpack-plugin | ^5.6.1 | JS 压缩 |
| css-minimizer-webpack-plugin | ^3.0.2 | CSS 压缩 |
| compression-webpack-plugin | ^8.0.1 | Gzip/Brotli 预压缩 |
| @pmmmwh/react-refresh-webpack-plugin | ^0.5.10 | React Fast Refresh |
| react-refresh | ^0.14.0 | React 热更新 |
| typescript | ^4.5.5 | TypeScript 支持 |
| tsconfig-paths-webpack-plugin | ^3.5.2 | TS 路径别名 |
| html-webpack-plugin | ^5.6.7 | HTML 模板生成 |
| html-loader | ^2.1.2 | HTML 资源加载 |
| svgo-loader | ^5.0.0 | SVG 压缩 |
| speed-measure-webpack-plugin | ^1.5.0 | 构建性能分析 |
| webpack-bundle-analyzer | ^4.5.0 | Bundle 分析 |
| terser-webpack-plugin | ^5.6.1 | JS 压缩 |
| uglify-js | ^3.15.5 | JS 压缩（遗留） |
| husky | ^7.0.4 | Git hooks |
| prettier | ^2.5.0 | 代码格式化 |
| chalk | ^4.1.2 | 终端颜色 |
| fs-extra | ^10.0.1 | 文件操作 |
| log4js | ^6.4.2 | 日志 |
| antd-dayjs-webpack-plugin | ^1.0.6 | Antd dayjs 按需加载 |
| extract-loader | ^5.1.0 | 资源提取 |
| @types/react | ^18.3.31 | React 类型定义 |
| @types/react-dom | ^18.3.7 | React DOM 类型定义 |

### dependencies
| 包名 | 版本 | 用途 |
|------|------|------|
| react | ^18.3.1 | 前端框架 |
| react-dom | ^18.3.1 | React DOM 渲染 |
| mobx | ^6.3.5 | 状态管理 |
| mobx-react | ^7.2.0 | MobX React 绑定 |
| antd | ^5.20.0 | UI 组件库 |
| @ant-design/icons | ^6.2.2 | Ant Design 图标 |
| dayjs | ^1.11.20 | 日期处理 |
| express | ^5.2.1 | 后端服务器 |
| markdown-it | ^14.3.0 | Markdown 解析 |
| markdown-it-anchor | ^9.2.1 | Markdown 锚点 |
| markdown-it-link-attributes | ^4.0.1 | Markdown 链接属性 |
| markdown-it-toc-done-right | ^4.2.0 | Markdown TOC |
| @wangeditor/editor | ^5.1.23 | 富文本编辑器核心 |
| @wangeditor/editor-for-react | ^1.0.6 | 富文本 React 封装 |
| vditor | ^3.11.2 | Markdown 编辑器 |
| @uiw/react-codemirror | ^4.25.11 | 代码编辑器 |
| @microlink/react-json-view | ^1.31.22 | JSON 可视化 |
| @textea/json-viewer | ^4.0.1 | JSON 查看器 |
| highlight.js | ^11.11.1 | 代码高亮 |
| classnames | ^2.3.1 | 条件 CSS 类名 |
| copy-to-clipboard | ^4.0.2 | 复制剪贴板 |
| crypto-js | ^4.1.1 | 加密工具 |
| jsqr | ^1.4.0 | 二维码解码 |
| lrz | ^4.9.41 | 图片压缩 |
| pako | 3.0.1 | 压缩/解压 |
| driver.js | ^1.7.0 | 页面引导 |
| react-fast-marquee | ^1.6.5 | 跑马灯动画 |
| @panzoom/panzoom | ^4.6.2 | 缩放/平移 |
| @mdit/plugin-alert | ^1.0.1 | Markdown 警告插件 |
| @mdit/plugin-tab | ^1.0.1 | Markdown Tab 插件 |
| lodash.clonedeep | ^4.5.0 | 深拷贝 |
| lodash.orderby | ^4.6.0 | 排序 |
| lodash.sortby | ^4.7.0 | 排序 |
| json5 | ^2.2.3 | JSON5 解析 |
| uslug | ^1.0.4 | 中文转 slug |
| methods-r | ^1.2.14 | HTTP 方法 |
| remons-components | ^2.0.8 | 内部组件库 |
| remons-render-markdown | ^1.0.0 | 内部 Markdown 渲染库 |

## 构建配置

### Webpack
- **版本**: 5.108.4
- **模式**: 多入口 MPA，每个 `src/apps/{name}/` 一个入口
- **编译器**: esbuild-loader（tsx, target: es2017, jsx: automatic）
- **Babel**: 仅用于装饰器支持（@babel/plugin-proposal-decorators legacy）
- **入口**: 动态扫描 `src/apps/` 目录，`main.jsx` 为入口
- **输出**: `dist/@website_pages/{page}/`
- **缓存**: 文件系统缓存（type: filesystem）
- **SplitChunks**: 已禁用（每个页面独立 chunk）

### CSS 处理
| 文件类型 | 开发环境 | 生产环境 |
|----------|---------|---------|
| `.css` | style-loader → css-loader → postcss-loader | MiniCssExtractPlugin → css-loader → postcss-loader |
| `.module.css` | style-loader → css-loader(modules) → postcss-loader | MiniCssExtractPlugin → css-loader(modules) → postcss-loader |
| `.less` | style-loader → css-loader → postcss-loader → less-loader | MiniCssExtractPlugin → css-loader → postcss-loader → less-loader |
| `.module.less` | style-loader → css-loader(modules) → postcss-loader → less-loader | MiniCssExtractPlugin → css-loader(modules) → postcss-loader → less-loader |

### 资源处理
| 类型 | 处理规则 |
|------|---------|
| JS/JSX/TS/TSX | esbuild-loader (tsx, target: es2017) + React Refresh |
| 图片 (jpg/png/jpeg/gif) | asset 类型, <8KB inline base64, 输出 `static/assets/images/` |
| SVG | asset/resource + svgo-loader 压缩 |
| Markdown | asset/source（原始文本） |
| 其他 (pdf/doc/node) | asset/resource |

### 生产环境 Externals (CDN)
以下库通过 npmmirror CDN 加载，不打包进产物：

| 库 | CDN URL |
|----|---------|
| react | npmmirror.com/react/18.3.1/files/umd/react.production.min.js |
| react-dom | npmmirror.com/react-dom/18.3.1/files/umd/react-dom.production.min.js |
| mobx | npmmirror.com/mobx/6.3.2/files/dist/mobx.umd.production.min.js |
| mobx-react-lite | npmmirror.com/mobx-react-lite/3.1.6/files/dist/mobxreactlite.umd.production.min.js |
| mobx-react | npmmirror.com/mobx-react/7.3.0/files/dist/mobxreact.umd.production.min.js |
| mermaid | npmmirror.com/mermaid/11.16.0/files/dist/mermaid.min.js |
| vditor | npmmirror.com/vditor/3.11.2/files/dist/index.min.js |
| antd + dayjs | npmmirror.com/antd/5.20.0/files/dist/antd.min.js |
| markdown-it | npmmirror.com/markdown-it/14.3.0/files/dist/markdown-it.min.js |
| @wangeditor/editor | npmmirror.com/@wangeditor/editor/5.1.23/files/dist/index.js |

### 压缩
| 类型 | 插件 | 配置 |
|------|------|------|
| JS | TerserPlugin | 去除 console.log/info/debugger/注释 |
| CSS | CssMinimizerPlugin | - |
| Brotli | CompressionPlugin | 默认开启，level 11，阈值 10KB，minRatio 0.8 |
| Gzip | CompressionPlugin | 可选（gzip=true），阈值 10KB，minRatio 0.8 |

### 并行打包
`scripts/build.js` 实现：
- 并发控制（`runWithConcurrency`）
- 实时进度条（TTY 模式）
- 超时保护（默认 5 分钟，`BUILD_TIMEOUT` 环境变量可调）
- 备份恢复机制（打包前先备份旧产物，失败自动恢复）
- 构建后输出详细产物大小统计（表格格式）

### PostCSS
```json
{
  "autoprefixer": {
    "overrideBrowserslist": ["> 1%", "last 2 versions"]
  }
}
```

### Babel
```json
{
  "presets": ["@babel/react", "@babel/env"],
  "plugins": [
    "@babel/plugin-transform-runtime",
    ["@babel/plugin-proposal-decorators", { "legacy": true }]
  ]
}
```

## TypeScript 配置

```json
{
  "compilerOptions": {
    "incremental": true,
    "target": "es5",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react",
    "strict": true,
    "strictPropertyInitialization": false,
    "alwaysStrict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@axios": ["src/axios"],
      "@axios/*": ["src/axios/*"],
      "@assets/*": ["src/assets/*"],
      "@utils": ["src/utils"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

## Prettier 配置

```json
{
  "tabWidth": 2,
  "singleQuote": true,
  "semi": false
}
```

## ESLint 配置

- **extends**: airbnb-base/legacy + plugin:react/recommended
- **parser**: @babel/eslint-parser
- **环境**: browser, node, jest
- **关闭规则**: no-param-reassign, no-new, no-undef, comma-dangle, react/prop-types, react/react-in-jsx-scope, class-methods-use-this
- **警告规则**: no-unused-vars, eqeqeq, no-prototype-builtins
- **linebreak-style**: off (Windows)

## 开发服务器
- **端口**: webpack-dev-server 自动分配
- **HTTPS**: 启用
- **HMR**: 启用（React Refresh）
- **静态目录**: `dist/`
- **开放页面**: 首个页面（`/@website_pages/{firstPage}`）
- **overlay**: 过滤 ResizeObserver 误报

## 生产服务器
- **框架**: Express 5
- **端口**: 8080
- **功能**: 静态文件服务 + 预压缩（Brotli > Gzip）
- **缓存策略**: HTML 不缓存，带 hash 的静态资源缓存 1 年
- **默认路由**: `/` → `tool/index.html`
