# 系统字体模板持久化技术设计文档

> 基于 `travelBadge` 图片编辑器现有的自定义字体模板（localStorage）和系统画布模板（MySQL）架构，将系统字体模板从前端硬编码常量迁移至数据库管理，支持管理员在线增删改查。

---

## 一、现状分析

### 1.1 当前字体模板体系

| 类型 | 存储方式 | 管理方式 | 数据来源 |
|------|----------|----------|----------|
| **系统字体模板** | 前端常量 `FONT_TEMPLATES`（`utils/constants.js`） | 硬编码，无法动态管理 | 开发者手动维护 |
| **自定义字体模板** | `localStorage` | 用户在属性面板保存当前文字样式 | 用户操作 |

### 1.2 改造目标

- 系统字体模板迁移至 **MySQL 数据库**，管理员可在线增删改查
- 管理员模式下，文字面板支持**新增系统字体模板**（用当前选中文字元素的样式）
- 管理员模式下，系统字体模板卡片支持**编辑、删除、同步当前样式**
- 普通用户只读，点击即可应用

---

## 二、数据结构

### 2.1 字体模板对象（运行时结构）

```json
{
  "id": 1,
  "label": "简约黑",
  "desc": "苹方 · 粗体 · 无装饰",
  "textProps": { ... },
  "sortOrder": 0,
  "status": 1,
  "createdBy": "admin",
  "createdAt": "2025-05-14T10:00:00Z"
}
```

### 2.2 `textProps` 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `fontFamily` | string | 字体名称 |
| `fontSize` | number | 字号（px） |
| `fontWeight` | string | 字重：`"normal"` / `"bold"` / `"600"` 等 |
| `fontStyle` | string | 斜体：`"normal"` 或 `"italic"` |
| `letterSpacing` | number | 字间距（px） |
| `color` | string | 颜色（hex） |
| `useGradient` | boolean | 是否启用渐变 |
| `gradientFrom` | string | 渐变起始色 |
| `gradientTo` | string | 渐变结束色 |
| `gradientAngle` | number | 渐变角度（deg） |
| `strokeColor` | string | 描边颜色 |
| `strokeWidth` | number | 描边宽度（0 = 不描边） |
| `shadowColor` | string | 阴影颜色 |
| `shadowBlur` | number | 阴影模糊半径（px） |
| `shadowOffsetX` | number | 阴影 X 偏移（px） |
| `shadowOffsetY` | number | 阴影 Y 偏移（px） |

---

## 三、服务端接口设计

### 3.1 接口清单

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/systemFontTemplate/list` | 获取全部系统字体模板列表 |
| `POST` | `/systemFontTemplate/add` | 新增系统字体模板（管理员） |
| `PUT` | `/systemFontTemplate/update` | 更新系统字体模板（管理员） |
| `DELETE` | `/systemFontTemplate/delete` | 删除系统字体模板（管理员） |

### 3.2 请求 / 响应格式

**新增 / 更新 Request：**

```json
{
  "id": 1,                          // 更新时必传
  "label": "简约黑",                // 必填，1~50 字符
  "desc": "苹方 · 粗体 · 无装饰",  // 可选，最长 200 字符
  "textProps": { ... },             // 必填，字体样式 JSON
  "sortOrder": 0,                   // 可选，排序权重
  "status": 1                       // 可选，1=启用 0=禁用
}
```

**列表 Response：**

```json
{
  "success": true,
  "data": [
    { "id": 1, "label": "简约黑", "desc": "...", "textProps": { ... }, "sortOrder": 0, "status": 1, "createdAt": "..." }
  ]
}
```

### 3.3 参数校验规则

| 字段 | 校验规则 |
|------|----------|
| `label` | 必填，长度 1~50 字符 |
| `desc` | 可选，最长 200 字符 |
| `textProps` | 必填，合法 JSON 对象 |
| `sortOrder` | 可选，整数，默认 0 |
| `status` | 可选，0 或 1，默认 1 |

---

## 四、数据库表结构

### 4.1 建表 SQL

```sql
CREATE TABLE `system_font_template` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT    COMMENT '主键 ID',
  `label`            VARCHAR(50)     NOT NULL                   COMMENT '模板名称',
  `desc`             VARCHAR(200)    NOT NULL DEFAULT ''        COMMENT '副标题 / 简短描述',
  `text_props`       JSON            NOT NULL                   COMMENT '字体样式属性（JSON）',
  `sort_order`       INT             NOT NULL DEFAULT 0         COMMENT '排列顺序，越小越靠前',
  `status`           TINYINT         NOT NULL DEFAULT 1         COMMENT '状态：1=启用 / 0=禁用',
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP                         COMMENT '创建时间',
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统字体模板表';
```

### 4.2 字段说明

| 列名 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGINT UNSIGNED | 是 | 自增主键 |
| `label` | VARCHAR(50) | **是** | 模板名称 |
| `desc` | VARCHAR(200) | 否 | 副标题描述 |
| `text_props` | JSON | **是** | 字体样式属性 |
| `sort_order` | INT | 否 | 排序权重，默认 0 |
| `status` | TINYINT | 否 | 1=上线 / 0=下线 |
| `created_by` | VARCHAR(64) | 否 | 操作人账号 |
| `created_at` | DATETIME | 是 | 创建时间（自动填充） |
| `updated_at` | DATETIME | 是 | 最后修改时间（自动更新） |

---

## 五、前端实现方案

### 5.1 新增文件

| 文件 | 说明 |
|------|------|
| `api/systemFontTemplate.js` | 系统字体模板 API 封装（list / add / update / delete） |
| `hooks/useSystemFontTemplates.js` | 系统字体模板管理 Hook（加载、增删改、状态管理） |

### 5.2 改造文件

| 文件 | 改造内容 |
|------|----------|
| `app.jsx` | 引入 `useSystemFontTemplates` Hook，将系统字体模板数据和操作方法传递给 TextPanel |
| `components/textPanel/index.jsx` | 系统字体模板区改为从接口加载；管理员模式下增加新增/编辑/删除/同步操作按钮 |
| `utils/constants.js` | 移除 `FONT_TEMPLATES` 硬编码常量 |

### 5.3 TextPanel 改造要点

**管理员模式下新增交互：**

1. **新增按钮**：系统字体模板区域头部增加"＋ 新增字体模板"按钮
2. **新增逻辑**：弹出内联表单（输入名称/描述），确认时取当前选中文字元素的 `textProps` 保存
3. **编辑按钮**：卡片 hover 显示编辑按钮，点击进入编辑模式
4. **同步按钮**：卡片 hover 显示同步按钮（🔄），用当前选中文字元素的样式覆盖模板 `textProps`
5. **删除按钮**：管理员模式下显示删除按钮，二次确认后删除

**新增 Props：**

| Prop | 类型 | 说明 |
|------|------|------|
| `isAdmin` | boolean | 是否管理员模式 |
| `systemFontTemplates` | array | 从接口加载的系统字体模板列表 |
| `onAddSystemFontTemplate` | function | 新增回调 |
| `onUpdateSystemFontTemplate` | function | 更新回调 |
| `onDeleteSystemFontTemplate` | function | 删除回调 |
| `selectedElement` | object | 当前选中元素（用于取 textProps） |

---

## 六、服务端实现方案

### 6.1 新增文件

| 文件 | 说明 |
|------|------|
| `controller/systemFontTemplate.js` | Controller（增删改查，软删除） |
| `routes/systemFontTemplate.js` | 路由注册（prefix `/systemFontTemplate`） |

### 6.2 实现要点

- **查询**：只返回 `status=1` 的记录，按 `sort_order ASC, id ASC` 排序
- **新增**：校验 `label` 和 `textProps` 必填，`textProps` 自动 JSON.stringify
- **更新**：动态拼接 SET 字段，只更新传入的字段
- **删除**：软删除，设置 `status=0`
- **路由注册**：在 `app.js` 中引入并 `app.use(router.routes())`

---

## 七、与现有系统画布模板的对比

| 维度 | 系统画布模板 (`system_template`) | 系统字体模板 (`system_font_template`) |
|------|------|------|
| **存储核心** | `template_content` JSON（含 elements 数组） | `text_props` JSON（仅字体样式属性） |
| **是否涉及图片上传** | ✅ 封面截图 + 元素图片 | ❌ 无图片，纯样式 |
| **应用方式** | 替换整个画布内容 | 将 textProps 应用到选中文字元素 |
| **管理员操作** | 新增 / 编辑名称描述 / 同步画布内容 / 删除 | 新增 / 编辑名称描述 / 同步当前文字样式 / 删除 |
| **数据量级** | 单条记录可达数十 KB（含元素坐标） | 单条记录 < 1 KB（纯样式属性） |

---
