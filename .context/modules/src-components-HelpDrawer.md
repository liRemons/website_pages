# 模块: src\components\HelpDrawer

### src\components\HelpDrawer

> **模块用途**: 帮助说明抽屉组件，点击帮助图标弹出底部 Drawer，渲染 Markdown 格式的操作说明文档。

**关键节点**:
- `HelpDrawer({ handleContent, title, placement })` — 接收 Markdown 内容、标题和抽屉位置
- 底部抽屉，高度 70vh，宽度 480px（右侧模式）
- 使用 `remons-render-markdown` 渲染 Markdown，支持代码高亮
- 无 `handleContent` 时不渲染

**函数说明**:
- `HelpDrawer({ handleContent, title, placement })` — 帮助抽屉，点击图标打开，右上角关闭按钮

- **文件数**: 2
- **总行数**: 62
- **文件类型**: .jsx: 1, .less: 1
**主要导出**:
- src\components\HelpDrawer\index.jsx:HelpDrawer

| 文件 | 行数 | 导出 |
|------|------|------|
| src\components\HelpDrawer\index.jsx | 42 | HelpDrawer |
| src\components\HelpDrawer\index.module.less | 20 | - |

