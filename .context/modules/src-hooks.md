# 模块: src\hooks

### src\hooks

- **文件数**: 2
- **总行数**: 167
- **文件类型**: .js: 2
**主要导出**:
- src\hooks\useLoadMermaid.js:useLoadMermaid
- src\hooks\useTheme.js:ThemeProvider
- src\hooks\useTheme.js:useTheme

### LLM 分析

> **模块用途**: 提供全局主题管理 Hook 和 Mermaid 懒加载 Hook，支持 light/dark/system 三种模式。

**关键节点**:
- `ThemeProvider` — 主题 Provider，在组件树中注入 theme/mode/isDark/setMode
- `useTheme()` — 消费主题的 Hook，返回 `{ theme, mode, isDark, setMode }`
- 模式持久化：localStorage 存储用户选择，key 为 `app-theme-mode`
- 系统主题监听：system 模式下监听 `prefers-color-scheme` 变化
- 跨 Root 同步：通过 `storage` 事件和 `MutationObserver` 实现多个 React Root 之间的主题同步
- `useLoadMermaid()` — 懒加载 Mermaid 库，避免首屏加载过重

**函数说明**:
- `ThemeProvider({ children })` — 主题上下文提供者，自动应用 `data-theme` 到 `document.documentElement`
- `useTheme()` — 返回当前主题状态和切换方法
- `useLoadMermaid()` — 异步加载 Mermaid 库并初始化

| 文件 | 行数 | 导出 |
|------|------|------|
| src\hooks\useLoadMermaid.js | 51 | useLoadMermaid |
| src\hooks\useTheme.js | 116 | ThemeProvider, useTheme |

