# 模块: src\apps\tableConfig

### src\apps\tableConfig

> **模块用途**: 低代码表单引擎，通过 JSON 配置驱动页面生成，支持搜索表单和表格配置，可实时预览并导出 React 源码。

**关键节点**:
- `TableConfig` — 主组件（类组件），两个 Tab 页：配置器和预览
- `ConfigBuilder` — 配置构建器，包含 SearchConfig（搜索配置）和 TableConfig（表格配置）子组件
- `PageRenderer` — 页面渲染器，包含 SearchForm（搜索表单）和 DataTable（数据表格），支持可拖拽面板
- `configParser.js` — 配置解析工具，`generateExampleConfig()` 生成示例配置
- `codeGenerator.js` — 代码生成工具，将 JSON 配置转换为 React 源码
- 支持 22 种表单组件类型，数据流：配置器 → JSON 配置 → 渲染器 → 生成页面

**函数说明**:
- `TableConfig` — 主入口，管理 builder/preview 两个 Tab
- `ConfigBuilder({ onPreview, initialConfig })` — 配置编辑器
- `PageRenderer({ config })` — 根据 JSON 配置渲染完整页面
- `generateExampleConfig()` — 生成示例 JSON 配置

- **文件数**: 2
- **总行数**: 95
- **文件类型**: .jsx: 2
**主要导出**:
- src\apps\tableConfig\app.jsx:TableConfig

| 文件 | 行数 | 导出 |
|------|------|------|
| src\apps\tableConfig\app.jsx | 81 | TableConfig |
| src\apps\tableConfig\main.jsx | 14 | - |

