# 代码风格

## 语言分布

| 语言 | 文件扩展名 | 使用场景 |
|------|-----------|---------|
| JavaScript (JSX) | `.js`, `.jsx` | 主要开发语言，绝大多数组件和逻辑 |
| TypeScript | `.ts` | 少量工具函数（driver.ts, isLogin.ts） |
| TypeScript (TSX) | `.tsx` | 无实际使用，但 tsconfig 和 webpack 支持 |
| Less | `.less` | CSS 预处理器（全局样式、组件样式） |
| CSS Modules | `.module.less`, `.module.css` | 组件级隔离样式 |
| CSS | `.css` | 部分简单页面样式 |
| EJS | `.ejs` | HTML 模板 |
| Markdown | `.md` | 功能说明文档（handle.md）、README |
| JSON | `.json` | 配置文件（package.json, pages.json, tsconfig.json 等） |

## 格式化（Prettier）

| 规则 | 值 |
|------|-----|
| 缩进 | 2 空格 |
| 引号 | 单引号 |
| 分号 | 无分号 |
| 尾逗号 | 关闭（comma-dangle: off） |

```json
// .prettierrc.json
{
  "tabWidth": 2,
  "singleQuote": true,
  "semi": false
}
```

## 代码规范（ESLint）

- **基础**: airbnb-base/legacy
- **React**: plugin:react/recommended
- **Parser**: @babel/eslint-parser
- **环境**: browser, node, jest

### 关闭的规则
| 规则 | 原因 |
|------|------|
| `no-param-reassign` | MobX action 需要修改参数 |
| `no-new` | 允许直接使用 new |
| `no-undef` | 全局变量较多（APP_NAME 等） |
| `comma-dangle` | Prettier 统一管理 |
| `react/prop-types` | 不使用 PropTypes 校验 |
| `react/react-in-jsx-scope` | React 17+ JSX transform 不需要 import React |
| `class-methods-use-this` | 允许不使用 this 的类方法 |

### 警告规则
| 规则 | 说明 |
|------|------|
| `no-unused-vars` | 未使用变量警告 |
| `eqeqeq` | 建议使用 === |
| `no-prototype-builtins` | 原型链方法警告 |

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件目录 | PascalCase | `CardList/`, `ThemeToggle/` |
| 组件文件 | PascalCase | `List.jsx`, `MermaidEditor.jsx` |
| 工具文件 | camelCase | `download.js`, `configParser.js` |
| Hook 文件 | camelCase with use prefix | `useTheme.js`, `useLoadMermaid.js` |
| 子应用目录 | camelCase | `jsonViewer/`, `travelBadge/` |
| CSS Modules | `.module.less` / `.module.css` | `index.module.less` |
| 全局样式 | 无前缀 | `index.global.less` |
| 配置文件 | kebab-case | `postcss.config.js` |

## 样式方案

### CSS Modules
- **使用方式**: `.module.less` 或 `.module.css` 后缀
- **开发环境**: `[path][name]-[local]`（可读性）
- **生产环境**: `[hash:base64:10]`（简短、不可预测）

### 全局样式
- `src/assets/css/variables.css` - CSS 变量（主题色等）
- `src/assets/css/index.global.less` - 全局样式

### 主题系统
- **实现方式**: CSS 变量 + `data-theme` 属性
- **模式**: light / dark / system（跟随系统）
- **初始化**: `src/index.ejs` 内联脚本（首屏防闪烁 FOUC）
- **持久化**: localStorage (`app-theme-mode`)

## 代码组织

### 组件目录结构
```
ComponentName/
├── index.jsx          # 主组件
└── index.module.less  # 样式（CSS Module）
    或
└── index.less         # 全局样式
```

### 子应用结构
```
src/apps/appName/
├── main.jsx           # Webpack 入口（React 18 createRoot 挂载）
├── app.jsx            # 根组件（布局、Provider 等）
├── handle.md          # 功能说明
├── pages/             # 页面组件
│   └── List.jsx       # 主页面
├── model/             # （可选）状态管理
│   ├── store.js       # MobX store
│   ├── server.js      # API 调用
│   └── const.js       # 常量
├── components/        # （可选）子组件
└── assets/            # （可选）静态资源
```

## 状态管理

- **库**: MobX 6 + mobx-react 7
- **模式**: observable + action + observer
- **位置**: `model/store.js`（各子应用独立 store）
- **API 层**: `model/server.js` → `src/axios/service()`

## HTTP 请求

- **基础**: 原生 `fetch`（非 axios 库）
- **封装**: `src/axios/index.js` → `service()`
- **功能**: 超时控制（20s）、全局 loading、Token 注入、错误提示
- **API 地址**: 环境变量判断（`src/utils/index.js` → HOST）
  - 生产: `https://remons.cn:3008`
  - 本地: `https://luckey.work:3008`

## 路径别名

```typescript
'@/'       → 'src/'
'@components/' → 'src/components/'
'@axios'   → 'src/axios'
'@assets/' → 'src/assets/'
'@utils'   → 'src/utils'
```

## 错误处理

- 必须包含 try-catch 或错误码检查
- 代码生成时需兜底空指针等异常
- fetch 请求封装中统一处理超时（AbortController）和 HTTP 错误

## SEO

每个页面通过 `scripts/pages.json` 配置完整 SEO 信息：
- `title` - 页面标题
- `description` - 页面描述
- `keywords` - 关键词
- `seoContent` - SEO 详细描述
- `subTitle` - 副标题

HTML 模板（`src/index.ejs`）同时支持：
- Open Graph 标签（og:title, og:description, og:type）
- Twitter Card 标签
- 百度统计

## Git 提交

- **规范**: conventional commits
- **工具**: husky（Git hooks）
- **格式**: `type(scope): description`
