# 模块: src\apps\tool

### src\apps\tool

> **模块用途**: 实用工具导航页，展示所有工具卡片列表，点击跳转对应工具页面，支持内部路由切换（如 doc 子页面）。

**关键节点**:
- `App` — 入口组件，根据 URL 参数 `page` 路由到 List（工具列表）或 Doc（文档）页面
- `List` — 工具卡片列表，使用 `CardList` 组件渲染，数据来源于 `scripts/pages.json`
- `openPage()` — 处理页面跳转，内部工具使用 `openApp()`，外部链接 `window.open()`
- `methods-r` — 路由工具库，提供 `openApp`、`IsPC`、`getSearchParams` 等
- `isLuckeyWork` — 环境变量检测，区分幸运工作环境和正式环境
- 工具卡片包含 title/icon/subTitle/hot/url/appName 字段

**函数说明**:
- `App` — 根据 URL 参数渲染不同子页面
- `ListPage` — 工具列表页，渲染 15+ 工具卡片
- `openPage({ url, params })` — 打开工具页面或外部链接

- **文件数**: 2
- **总行数**: 37
- **文件类型**: .jsx: 2
**主要导出**:
- src\apps\tool\app.jsx:App

| 文件 | 行数 | 导出 |
|------|------|------|
| src\apps\tool\app.jsx | 23 | App |
| src\apps\tool\main.jsx | 14 | - |

