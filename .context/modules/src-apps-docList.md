# 模块: src\apps\docList

### src\apps\docList

> **模块用途**: 技术文章列表和详情页，支持 Markdown 渲染、锚点导航、HTML/Markdown 内容复制。

**关键节点**:
- `App` — 入口组件，渲染 `List` 页面
- `List` — 主页面，三栏布局：左侧文章列表、中间 Markdown 内容、右侧锚点导航
- `Store` — MobX 状态管理，管理文章列表、Markdown 内容、锚点列表、HTML 内容
- `Server` — API 层，调用 `/content/queryArticleList`（文章列表）、`/content/markdownToHTML`（服务端 Markdown 转 HTML）
- `Markdown` — 使用 `remons-render-markdown` 渲染 HTML，支持代码高亮、代码块折叠
- `Anchor` — 锚点导航组件，支持搜索过滤
- 复制功能：支持复制带格式 HTML（ClipboardItem）和原始 Markdown
- 移动端：Drawer 抽屉展示文章列表和导航
- 分享模式：URL 参数 `handleType=share` 隐藏操作按钮

**函数说明**:
- `queryArticleList(params)` — 获取文章列表
- `markdownToHTML(id)` — 获取文章 HTML 和 Markdown 内容
- `copyContent(type)` — 复制 HTML 或 Markdown 内容
- `getVisibleHtml()` — 获取当前可见的渲染 HTML（去除隐藏节点）

- **文件数**: 2
- **总行数**: 22
- **文件类型**: .jsx: 2
**主要导出**:
- src\apps\docList\app.jsx:App

| 文件 | 行数 | 导出 |
|------|------|------|
| src\apps\docList\app.jsx | 8 | App |
| src\apps\docList\main.jsx | 14 | - |

