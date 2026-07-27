# 模块分析

## 目录结构

```
website_pages/
├── config/              # 构建配置
│   ├── cdn.js          # CDN externals 配置（js/css CDN URL 映射）
│   └── rules.js        # Webpack loader rules（CSS/Less/图片/SVG/MD 等）
├── scripts/            # 构建脚本
│   ├── build.js        # 生产构建（并行打包、进度条、超时保护、备份恢复）
│   ├── dev.js          # 开发服务器启动（调用 webpack serve）
│   ├── common.js       # 公共工具（getPages, getDist, setExternals, templateParameters）
│   ├── log.js          # 日志工具
│   └── pages.json      # 页面元数据（SEO：标题、描述、关键词、SEO 内容）
├── src/
│   ├── index.ejs       # HTML 模板（主题防闪烁、SEO、百度统计、CDN externals 注入）
│   ├── axios/          # HTTP 请求封装（基于原生 fetch）
│   │   └── index.js    # service() - 请求封装，超时控制，全局 loading
│   ├── components/     # 公共组件
│   │   ├── CardList/   # 卡片列表组件
│   │   ├── Container/  # 容器布局组件
│   │   ├── Empty/      # 空状态组件
│   │   ├── Fixed/      # 固定定位组件
│   │   ├── Form/       # 表单组件
│   │   ├── Header/     # 页头组件（导航、主题切换、登录状态）
│   │   ├── HelpDrawer/ # 帮助抽屉组件
│   │   ├── ScanQr/     # 扫码组件
│   │   └── ThemeToggle/ # 主题切换组件
│   ├── hooks/          # 公共 hooks
│   │   ├── useLoadMermaid.js  # 动态加载 Mermaid
│   │   └── useTheme.js       # 主题切换 hook
│   ├── utils/          # 工具函数
│   │   ├── index.js    # HOST (API 地址), USER_TOKEN, img (SVG 辅助)
│   │   ├── download.js # 文件下载工具
│   │   ├── driver.ts   # 页面引导（driver.js 封装）
│   │   ├── isLogin.ts  # 登录状态检查
│   │   ├── luckey.js   # 本地开发环境判断
│   │   ├── preload.js  # 预加载工具
│   │   └── zip.js      # 压缩工具
│   ├── assets/         # 公共资源
│   │   ├── css/        # 全局样式（variables.css CSS 变量, index.global.less）
│   │   └── svg/        # 公共 SVG 图标（back, help, home, share, scan, mermaid）
│   └── apps/           # 子应用（23个）
│       ├── createQR/          # 生成二维码
│       │   ├── main.jsx       # 入口
│       │   ├── app.jsx        # 根组件
│       │   ├── handle.md      # 功能说明
│       │   ├── model/         # MobX store + qrcode 逻辑
│       │   └── pages/         # List.jsx, qrcode.css
│       ├── docList/           # 文章列表
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── model/         # server.js, store.js
│       │   └── pages/         # Anchor, List, Markdown
│       ├── express/           # 快递查询
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx
│       ├── home/              # 首页
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx, home.js, home.css, assets/svg
│       ├── homeList/          # 主页（工具分类列表）
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx, assets/svg
│       ├── imgWatermark/      # 图片水印
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx
│       ├── jsonViewer/        # JSON 解析器
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx
│       ├── login/             # 登录
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── model/         # const.js, server.js, store.js
│       │   └── assets/        # login.svg
│       ├── mermaid/           # Mermaid 图表编辑器
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx, constants.js, components/MermaidEditor, MermaidPreview
│       ├── my/                # 个人中心
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── model/         # const.js, server.js, store.js, utils.js
│       │   └── pages/         # List.jsx
│       ├── note/              # 学习笔记
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── model/         # server.js, store.js
│       │   └── pages/         # List.jsx
│       ├── postmarkGenerator/ # 邮戳生成器
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── app.less
│       │   ├── constants.js
│       │   ├── handle.md
│       │   ├── canvas/        # drawers.js（绘图逻辑）
│       │   └── -
│       ├── productManage/     # 订单管理
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── assets/        # 平台图标（淘宝、拼多多、抖音、小红书、抖音小店）
│       │   ├── components/    # addFieldForm, addForm, addPlatForm, addStatus, list
│       │   └── model/         # const.js
│       ├── reMark/            # Markdown 编辑器（所见即所得）
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List
│       ├── scanqr/            # 扫描二维码
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx
│       ├── simpleSketches/    # 简笔画生成器
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── app.css
│       │   ├── handle.md
│       │   └── -
│       ├── tableConfig/       # 表单引擎（低代码）
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── README.md
│       │   ├── components/    # CodeEditor, ConfigBuilder, PageRenderer
│       │   ├── styles/        # index.less
│       │   └── utils/         # codeGenerator.js, configParser.js
│       ├── timeCalculator/    # 时间计算
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx
│       ├── tool/              # 实用工具列表
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── model/         # server.js, store.js
│       │   └── pages/         # List, Doc, assets/svg（各类工具图标）
│       ├── transcoderQR/      # 二维码解析
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── pages/         # List.jsx
│       ├── travelBadge/       # 旅行勋章
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   ├── index.less
│       │   ├── api/           # systemFontTemplate.js, systemTemplate.js
│       │   ├── components/    # appHeader, canvasArea, draggableElement, imagePanel,
│       │   │                  # imagePropsEditor, panelTabs, propsPanel, templatePanel,
│       │   │                  # textPanel, textPropsEditor
│       │   ├── docs/          # 系统设计文档
│       │   ├── hooks/         # useFontTemplates, useIsMobile, useSystemFontTemplates,
│       │   │                  # useSystemTemplates, useTemplates, useTheme
│       │   ├── i18n/          # 多语言（en, zh-CN, zh-TW）
│       │   └── utils/         # canvasHelpers, constants, exportCanvas, fontLoader,
│       │                       # snapHelpers, styleHelpers
│       ├── urlCoder/          # URL 编码
│       │   ├── main.jsx
│       │   ├── app.jsx
│       │   ├── handle.md
│       │   └── -
│       └── wangEditor/        # 富文本编辑器
│           ├── main.jsx
│           ├── app.jsx
│           ├── handle.md
│           └── pages/         # List.jsx
├── website_server.js   # Express 生产服务器（预压缩、缓存策略）
├── webpack.config.js   # Webpack 多入口打包配置
├── package.json
├── tsconfig.json
├── .eslintrc
├── .prettierrc.json
├── .babelrc
├── postcss.config.js
└── global.d.ts
```

## 子应用统一结构

每个 `src/apps/{name}/` 遵循以下约定：

| 文件/目录 | 必填 | 说明 |
|-----------|------|------|
| `main.jsx` | ✅ | Webpack 入口，挂载 React 应用 |
| `app.jsx` | ✅ | 根组件（包含 Header 等布局） |
| `handle.md` | ✅ | 功能说明文档（Markdown，由 webpack asset/source 加载） |
| `pages/` | ✅ | 页面组件（通常是 `List.jsx`） |
| `model/` | ❌ | MobX store + server API（需要后端交互时使用） |
| `components/` | ❌ | 自定义组件 |
| `assets/` | ❌ | 静态资源（图片、SVG 等） |

### 数据流
```
main.jsx → app.jsx → pages/List.jsx
                    ↓
              model/store.js (MobX observable + action)
                    ↓
              model/server.js (API 调用 → src/axios/service)
```

## 公共组件

| 组件 | 路径 | 职责 |
|------|------|------|
| CardList | `src/components/CardList/` | 卡片式列表展示 |
| Container | `src/components/Container/` | 通用容器布局 |
| Empty | `src/components/Empty/` | 空状态占位 |
| Fixed | `src/components/Fixed/` | 固定定位元素 |
| Form | `src/components/Form/` | 表单组件（含 const.jsx 配置） |
| Header | `src/components/Header/` | 页头导航（Logo、搜索、用户菜单、主题切换） |
| HelpDrawer | `src/components/HelpDrawer/` | 帮助抽屉面板 |
| ScanQr | `src/components/ScanQr/` | 扫码功能组件 |
| ThemeToggle | `src/components/ThemeToggle/` | 主题切换开关（light/dark/system） |

## 公共 Hooks

| Hook | 路径 | 职责 |
|------|------|------|
| useLoadMermaid | `src/hooks/useLoadMermaid.js` | 动态加载 Mermaid 库（CDN） |
| useTheme | `src/hooks/useTheme.js` | 主题状态管理（light/dark/system） |

## 公共工具

| 工具 | 路径 | 职责 |
|------|------|------|
| service | `src/axios/index.js` | 基于 fetch 的 HTTP 请求封装，支持超时、loading、token |
| HOST | `src/utils/index.js` | API 地址（生产: remons.cn:3008, 开发: luckey.work:3008） |
| USER_TOKEN | `src/utils/index.js` | Token 存储键名 |
| img | `src/utils/index.js` | SVG 图片渲染辅助函数 |
| download | `src/utils/download.js` | 文件下载工具 |
| driver | `src/utils/driver.ts` | 页面引导（driver.js） |
| isLogin | `src/utils/isLogin.ts` | 登录状态检查 |
| luckey | `src/utils/luckey.js` | 本地开发环境判断 |
| preload | `src/utils/preload.js` | 资源预加载 |
| zip | `src/utils/zip.js` | 压缩/解压工具 |

## 复杂子应用

### travelBadge（旅行勋章）
独立程度最高的子应用，拥有完整的模块划分：
- **api/** - 系统字体模板、系统模板 API
- **components/** - 10 个独立组件（画布、拖拽元素、面板、属性编辑器等）
- **hooks/** - 6 个自定义 hooks
- **i18n/** - 三语言支持（简体中文、繁体中文、英语）
- **utils/** - 6 个工具模块（画布辅助、导出、字体加载、吸附、样式等）
- **docs/** - 设计文档

### tableConfig（表单引擎）
低代码表单配置工具：
- **components/ConfigBuilder/** - 配置构建器（搜索配置、表格配置）
- **components/PageRenderer/** - 页面渲染器（数据表格、搜索表单、可调整面板）
- **components/CodeEditor/** - 代码编辑器
- **utils/** - 代码生成器、配置解析器

## 忽略页面
`scripts/common.js` 中 `ignorePages: ['my']`，构建时默认排除 `my` 页面（个人中心需登录）。
