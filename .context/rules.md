# 项目规则

> 生成时间: 2026-07-27T08:20:37.525Z

## JSON 配置示例

```json
{
  "naming": {
    "variables": "camelCase",
    "functions": "camelCase",
    "classes": "PascalCase",
    "constants": "UPPER_SNAKE_CASE",
    "files": "kebab-case"
  },
  "limits": {
    "maxFileLength": 500,
    "maxFunctionLength": 80,
    "maxLineLength": 120
  },
  "git": {
    "commitFormat": "conventional",
    "branchPrefix": "feature/"
  },
  "codeStyle": {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5"
  },
  "customRules": [
    "所有公共函数必须有 JSDoc 注释",
    "异步操作必须包含错误处理"
  ]
}
```
## Linter 配置

- **启用的 Linter**: eslint, prettier

