# 模块: src\apps\travelBadge

### src\apps\travelBadge

> **模块用途**: 旅行勋章编辑器，Canvas 画布应用，支持拖拽文字和图片元素，提供模板管理、属性编辑和一键导出图片功能。支持 i18n（中/英/繁）。

**关键节点**:
- `App` — 主组件，管理元素列表状态（`elements`），负责元素增删改查
- `CanvasArea` — 画布区域，支持 PanZoom 缩放拖拽，点击选中元素
- `DraggableElement` — 可拖拽元素组件，支持文字和图片两种类型
- `TemplatePanel` — 模板面板，支持系统模板和自定义模板
- `TextPanel` / `ImagePanel` — 文字和图片元素面板，提供元素添加到画布
- `PropsPanel` / `TextPropsEditor` / `ImagePropsEditor` — 属性编辑面板
- `PanelTabs` — 底部 Tab 切换模板/图片/文字
- `AppHeader` — 顶部导航栏，提供导出、撤销等功能
- 元素状态管理：`useState` 管理 `elements` 数组，`useCallback` 封装增删改操作
- 字体模板：支持系统字体模板和自定义字体模板，可应用/编辑/保存
- 移动端适配：抽屉式底部面板，支持拖拽调整高度
- `exportToImage()` — 导出画布为 2x 高清图片

**函数说明**:
- `App(props)` — 旅行勋章编辑器主组件
- `applyFontTemplate(fontTemplate)` — 应用字体模板到选中文字或新建文字元素
- `handleExport()` — 导出当前画布为图片
- `addTextElement()` / `addImageElement()` — 添加文字/图片元素到画布
- `updateElement(id, patch)` / `deleteElement(id)` — 更新/删除元素

- **文件数**: 3
- **总行数**: 878
- **文件类型**: .jsx: 2, .less: 1
| 文件 | 行数 | 导出 |
|------|------|------|
| src\apps\travelBadge\app.jsx | 541 | - |
| src\apps\travelBadge\index.less | 325 | - |
| src\apps\travelBadge\main.jsx | 12 | - |

