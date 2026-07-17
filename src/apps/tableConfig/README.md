# TableConfig - 可配置化页面系统

一个基于 React + Ant Design 的可视化页面配置系统，支持通过 JSON 配置快速生成增删改查页面，并导出可运行的 React 源码。

## 功能特性

- **可视化配置器**：通过表单配置搜索条件、表格列、操作按钮等
  - 支持 22 种表单组件类型（input、select、datePicker、treeSelect 等）
  - 弹出式编辑框，操作更流畅
  - 支持字段上移、下移排序
- **实时预览**：配置完成后可立即预览页面效果
- **代码导出**：支持导出完整的 React 项目源码，包含：
  - 独立拆分的组件（SearchForm、EditModal）
  - 独立的 Services 层
  - 样式文件
  - 类型定义
- **代码高亮预览**：导出预览支持语法高亮，基于 Prism.js
- **可拖拽面板**：文件树和代码预览区域支持拖拽调整大小

## 项目目录

```
tableConfig/
├── app.jsx                          # 应用主入口
├── main.jsx                         # 渲染入口
├── styles/
│   └── index.less                   # 全局样式
├── components/
│   ├── ConfigBuilder/               # 配置构建器
│   │   ├── index.jsx                # 配置器主组件
│   │   ├── SearchConfig.jsx         # 搜索条件配置
│   │   └── TableConfig.jsx          # 表格列配置
│   ├── PageRenderer/                # 页面渲染器
│   │   ├── index.jsx                # 渲染器主组件
│   │   ├── SearchForm.jsx           # 搜索表单组件
│   │   ├── DataTable.jsx            # 数据表格组件
│   │   └── ResizablePanels.less     # 可拖拽面板样式
│   ├── CodeEditor.jsx               # 代码编辑器组件
│   ├── CodeHighlighter.jsx          # 代码高亮组件
│   └── MarkdownRenderer.jsx         # Markdown 渲染组件
└── utils/
    ├── configParser.js              # 配置解析工具
    └── codeGenerator.js             # 代码生成器
```

## 核心组件说明

### ConfigBuilder（配置构建器）
- 提供可视化表单配置界面
- 支持配置页面标题、搜索条件、表格列
- 支持配置操作按钮（增删改查）
- 实时验证配置合法性

### PageRenderer（页面渲染器）
- 根据 JSON 配置渲染完整的增删改查页面
- 支持搜索、分页、排序
- 支持编辑、删除操作
- 集成导出源码功能

### CodeGenerator（代码生成器）
- 将 JSON 配置转换为 React 组件源码
- 自动拆分组件结构
- 生成 Services 层代码
- 生成样式文件

## 安装依赖

除 React 基础依赖外，需要安装以下依赖：

```bash
# 核心 UI 库
npm install antd@^5.20.0 --save

# 可拖拽面板
npm install react-resizable@^3.1.3 --save

# 工具库
npm install moment --save
npm install @ant-design/icons@^5.0.0 --save
```

## 完整安装命令

```bash
npm install antd@^5.20.0 react-resizable@^3.1.3 moment @ant-design/icons@^5.0.0 --save
```

## 使用方式

### 1. 开发模式
```bash
npm run dev
```

### 2. 构建生产环境
```bash
npm run build
```

### 3. 使用配置器

1. 打开页面，进入"配置器" Tab
2. 配置页面标题、搜索条件、表格列
3. 点击"预览"查看效果
4. 点击"导出源码"获取完整项目代码

## 配置示例

```json
{
  "pageConfig": {
    "title": "用户管理"
  },
  "searchConfig": {
    "layout": "inline",
    "fields": [
      {
        "type": "input",
        "name": "username",
        "label": "用户名",
        "placeholder": "请输入用户名"
      }
    ]
  },
  "tableConfig": {
    "columns": [
      {
        "title": "用户名",
        "dataIndex": "username",
        "key": "username"
      }
    ],
    "actions": {
      "showEdit": true,
      "showDelete": true
    }
  }
}
```

## 导出项目结构

导出后的项目包含以下文件：

```
src/
├── pages/
│   ├── index.jsx              # 主页面组件
│   ├── index.less             # 样式文件
│   ├── components/
│   │   ├── SearchForm.jsx     # 搜索表单组件
│   │   └── EditModal.jsx      # 编辑弹窗组件
│   └── services/
│       └── index.js           # API 服务层
├── config.json                # 配置文件
└── README.md                  # 使用说明
```

## 技术栈

- **React** 17.0.2 - 前端框架
- **Ant Design** 5.20.0 - UI 组件库
- **Prism.js** 1.30.0 - 代码语法高亮
- **React Resizable** 3.1.3 - 可拖拽调整大小
- **Less** - CSS 预处理器

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
