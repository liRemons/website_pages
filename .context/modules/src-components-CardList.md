# 模块: src\components\CardList

### src\components\CardList

### LLM 分析

> **模块用途**: 卡片网格列表组件，用于工具导航页展示工具卡片，支持图标、标题、副标题和 HOT 标签。

**关键节点**:
- `CardList({ list, itemClick })` — 接收卡片数据列表和点击回调
- 响应式布局：PC 端 4 列，移动端 2 列
- 按 `hot` 字段排序，HOT 项置顶并显示红色 Ribbon 标签
- 图片通过 `HOST` 前缀拼接完整 URL
- 使用 Ant Design 的 `List` + `Card` + `Badge.Ribbon` 组合

**函数说明**:
- `CardList({ list, itemClick })` — 渲染卡片网格，list 项包含 title/icon/subTitle/hot/url 字段

| 文件 | 行数 | 导出 |
|------|------|------|
| src\components\CardList\index.jsx | 48 | - |
| src\components\CardList\index.module.less | 111 | - |

