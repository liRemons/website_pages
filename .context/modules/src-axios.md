# 模块: src\axios

### src\axios

> **模块用途**: 页面模块，主要负责 UI 展示和路由

- **文件数**: 1
- **总行数**: 126
- **文件类型**: .js: 1

**函数说明**:
- `service` — * 基于原生 fetch 实现的请求封装（index.js）
- `timeoutId` — * 基于原生 fetch 实现的请求封装（index.js）

### LLM 分析

> **模块用途**: 基于原生 fetch 封装的统一请求层，提供全局 loading 控制、Token 注入、超时处理和错误提示。

**关键节点**:
- `service({ method, url, data, params, headers })` — 核心请求函数，支持 GET/POST，自动注入 USER_TOKEN
- `controlLoading({ isOpen })` — 全局 loading 显示/隐藏，延迟 200ms 触发避免闪烁
- `showLoading()` / `hideLoading()` — 引用计数控制，支持并发请求
- 超时控制：20s AbortController 超时，超时弹出 message.error
- 错误处理：HTTP 非 2xx 状态码抛 Error，`res.success=false` 弹 message.error
- `noLoadingURL` — 无需 loading 的 URL 白名单

**函数说明**:
- `service({ method, url, data, params, headers })` — 发起 HTTP 请求，返回 Promise，自动处理 JSON/FormData/URL-encoded 格式

| 文件 | 行数 | 导出 |
|------|------|------|
| src\axios\index.js | 126 | - |

