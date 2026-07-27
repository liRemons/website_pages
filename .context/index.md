# website_pages 项目概览

## 基本信息
- **项目名称**: website_pages
- **版本**: 1.0.0
- **描述**: 多页应用工具集网站（remons.cn），提供二维码生成/解析、JSON查看器、Mermaid图表、Markdown编辑器、图片水印、时间计算、快递查询、表单引擎、旅行勋章、邮戳生成器等 23 个在线工具
- **项目路径**: `c:\Users\admin\job\website_pages`
- **许可证**: ISC

## 技术栈概览
| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | React | ^18.3.1 |
| UI 组件库 | Ant Design | ^5.20.0 |
| 状态管理 | MobX + mobx-react | ^6.3.5 / ^7.2.0 |
| 构建工具 | Webpack | ^5.108.4 |
| 编译器 | esbuild-loader | ^4.5.0 |
| CSS 预处理器 | Less | ^4.1.1 |
| 类型支持 | TypeScript | ^4.5.5 |
| 后端服务器 | Express | ^5.2.1 |
| 富文本编辑器 | @wangeditor/editor | ^5.1.23 |
| Markdown 渲染 | markdown-it | ^14.3.0 |

## 架构概述
- **架构模式**: 多页应用 (MPA)，每个子应用独立打包
- **入口结构**: `src/apps/{appName}/main.jsx` → `app.jsx` → `pages/List.jsx`
- **共享资源**: `src/components/`, `src/utils/`, `src/axios/`, `src/hooks/`, `src/assets/`
- **CDN 外部化**: 生产环境将 React、Antd、MobX 等库通过 CDN 加载（npmmirror）
- **部署方式**: 静态文件部署，Express 服务器提供静态文件服务和预压缩文件支持（Brotli/Gzip）

## 功能模块 (23 个子应用)
| 应用名 | 功能描述 | 应用名 | 功能描述 |
|--------|---------|--------|---------|
| home | 首页 | homeList | 主页（工具分类列表） |
| tool | 实用工具（工具入口页） | createQR | 生成二维码 |
| transcoderQR | 解析二维码 | scanqr | 扫描二维码 |
| jsonViewer | JSON 解析器 | mermaid | Mermaid 图表编辑器 |
| reMark | Markdown 编辑器（所见即所得） | wangEditor | 富文本编辑器 |
| imgWatermark | 图片水印 | timeCalculator | 时间计算 |
| urlCoder | URL 转编码 | express | 快递查询 |
| docList | 文章列表 | note | 学习笔记 |
| my | 个人中心 | login | 登录 |
| productManage | 订单管理 | travelBadge | 旅行勋章 |
| tableConfig | 表单引擎（低代码） | simpleSketches | 简笔画生成器 |
| postmarkGenerator | 邮戳生成器 | - | - |

## 关键文件
| 文件 | 说明 |
|------|------|
| `webpack.config.js` | Webpack 多入口打包配置 |
| `scripts/pages.json` | 页面元数据（SEO 信息、标题、描述） |
| `scripts/dev.js` | 开发服务器启动脚本 |
| `scripts/build.js` | 生产构建脚本（并行打包、进度条、超时保护、备份恢复） |
| `scripts/common.js` | 公共脚本（页面发现、externals、CDN 注入） |
| `config/rules.js` | Webpack 模块处理规则 |
| `config/cdn.js` | CDN 外部化资源映射 |
| `src/index.ejs` | HTML 模板（主题防闪烁、SEO、百度统计） |
| `website_server.js` | Express 生产服务器（端口 8080，预压缩支持） |
| `src/axios/index.js` | 请求封装（基于原生 fetch） |

## 环境信息
| 环境 | 说明 |
|------|------|
| 开发服务器 | webpack-dev-server (HTTPS, HMR) |
| 生产服务器 | Express 8080 |
| API 地址（生产） | https://remons.cn:3008 |
| API 地址（本地开发） | https://luckey.work:3008 |
| 构建输出 | `dist/@website_pages/` |

## 脚本命令
| 命令 | 说明 |
|------|------|
| `npm start` / `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（并行打包 + Brotli 压缩） |
| `npm run build report=true` | 构建并分析 Bundle |
| `npm run build gzip=true` | 额外生成 Gzip 压缩文件 |
| `npm run build br=true` | 额外生成 Brotli 压缩文件（默认已开启） |

## 目录结构概览
```
website_pages/
├── config/              # 构建配置
│   ├── cdn.js          # CDN externals 配置
│   └── rules.js        # Webpack loader rules
├── scripts/            # 构建脚本
│   ├── build.js        # 生产构建（并行打包）
│   ├── dev.js          # 开发服务器启动
│   ├── common.js       # 公共工具
│   ├── log.js          # 日志工具
│   └── pages.json      # 页面元数据（SEO）
├── src/
│   ├── index.ejs       # HTML 模板
│   ├── axios/          # HTTP 请求封装
│   ├── components/     # 公共组件
│   ├── hooks/          # 公共 hooks
│   ├── utils/          # 工具函数
│   ├── assets/         # 公共资源
│   └── apps/           # 23 个子应用
├── website_server.js   # Express 生产服务器
├── webpack.config.js
├── package.json
├── tsconfig.json
├── .eslintrc
├── .prettierrc.json
├── .babelrc
├── postcss.config.js
└── global.d.ts
```

## 文档索引
- [config.md](./config.md) - 配置信息（依赖、构建工具、技术栈、脚本命令）
- [modules.md](./modules.md) - 模块分析（目录结构、模块详情、导出内容、文件列表）
- [code-style.md](./code-style.md) - 代码风格（语言分布、命名约定、代码组织）
- [dependencies.json](./dependencies.json) - 模块间依赖关系图
