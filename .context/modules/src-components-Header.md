# 模块: src\components\Header

### src\components\Header

### LLM 分析

> **模块用途**: 通用页面头部栏组件，提供标题展示、左侧返回按钮和右侧操作区，支持自定义左右内容。

**关键节点**:
- `Header({ name, showLeft, showRight, leftPath, leftComponent, rightComponent, handleContent })` — 左右布局的头部组件
- 左侧默认为返回按钮，点击跳转 `leftPath` 或默认 `/homeList`
- 右侧默认显示 `HelpDrawer` 帮助抽屉（当传入 `handleContent` 时）
- 支持完全自定义 `leftComponent` 和 `rightComponent`

**函数说明**:
- `Header(props)` — 渲染页面头部，name 居中，左侧返回，右侧帮助

| 文件 | 行数 | 导出 |
|------|------|------|
| src\components\Header\index.jsx | 35 | Header |
| src\components\Header\index.module.less | 37 | - |

