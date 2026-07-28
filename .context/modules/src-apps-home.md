# 模块: src\apps\home

### src\apps\home

> **模块用途**: 首页模块，包含粒子动画效果（`home.js` 中的粒子系统）和工具卡片列表（`List.jsx`）。

**关键节点**:
- `App` — 入口组件，渲染 `List` 页面
- `List.jsx` — 首页页面，展示工具卡片列表
- `home.js` — 粒子动画系统，支持命令交互（countdown/rectangle/circle/time 等）
- `home.css` — 首页样式
- 粒子系统使用 Canvas 绘制，支持用户输入命令触发不同动画效果
- 通过 `handle.md` 文件提供操作说明

**函数说明**:
- `App` — 首页入口组件
- `List` — 首页页面组件
- `performAction(value)` — 执行粒子动画命令

- **文件数**: 2
- **总行数**: 21
- **文件类型**: .jsx: 2
**主要导出**:
- src\apps\home\app.jsx:App

| 文件 | 行数 | 导出 |
|------|------|------|
| src\apps\home\app.jsx | 7 | App |
| src\apps\home\main.jsx | 14 | - |

