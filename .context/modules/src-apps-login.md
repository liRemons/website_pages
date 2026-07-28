# 模块: src\apps\login

### src\apps\login

> **模块用途**: 用户登录模块，提供账号密码登录功能，密码经 DES 加密后提交，登录成功存储 Token 并跳转。

**关键节点**:
- `NormalLoginForm` — 登录页面，使用 Ant Design Form 表单
- 密码加密：`encrypt({ DES_KEY, DES_IV, MSG })` 使用 CryptoJS DES-CBC-PKCS7 加密
- Token 存储：登录成功后 `localStorage.setItem(USER_TOKEN, token)`
- 登录重定向：URL 带 `from` 参数则跳转目标页，否则跳首页
- 使用 MobX Store 管理状态，`useLocalObservable` 连接组件

**函数说明**:
- `NormalLoginForm` — 登录表单组件，提交账号密码并处理登录逻辑
- `encrypt({ DES_KEY, DES_IV, MSG })` — DES 加密函数
- `decrypt({ DES_KEY, DES_IV, MSG })` — DES 解密函数
- `login(data)` — 调用 `/user/login` 接口

- **文件数**: 3
- **总行数**: 131
- **文件类型**: .jsx: 2, .less: 1
| 文件 | 行数 | 导出 |
|------|------|------|
| src\apps\login\app.jsx | 91 | - |
| src\apps\login\index.module.less | 26 | - |
| src\apps\login\main.jsx | 14 | - |

