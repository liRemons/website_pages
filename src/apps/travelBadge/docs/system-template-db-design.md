# 系统模板持久化技术设计文档

> 基于 `travelBadge` 图片编辑器的真实前端数据结构设计，适用于系统模板从 localStorage 迁移至数据库的完整改造方案。

---

## 一、前端上传图片

模板中的图片分两类处理：

### 1.1 模板封面缩略图（预览用）

保存模板时，前端用 `html2canvas` / `canvas.toBlob` 对当前画布截图，生成一张缩略图，通过 **multipart/form-data** 上传到服务端，换回一个 CDN URL 存入模板的 `coverUrl` 字段。

```
[前端截图] → Blob → FormData → POST /api/upload/image → { url: "https://cdn.xxx.com/covers/xxx.jpg" }
```

### 1.2 模板内元素中的图片

画布上用户添加的图片元素（`type: "image"`），其 `src` 初始存储的是 **base64 dataURL**。在保存模板前，前端需批量将这些 base64 上传换成 CDN URL，再序列化进模板 JSON：

```
elements[].src (base64)
  → POST /api/upload/image → { url: "https://cdn.xxx.com/..." }
  → elements[].src = CDN URL（替换后再存库）
```

### 1.3 上传接口约定

```
POST /api/upload/image
Content-Type: multipart/form-data

Request:
  file:  File | Blob               // 图片文件或 blob
  scene: "cover" | "element"       // 用途标识（封面 or 元素）

Response:
  { code: 0, data: { url: string } }
```

---

## 二、前端数据及结构

### 2.1 模板对象（运行时完整结构）

```json
{
  "id": "system_custom_1746680000000",
  "label": "极简白框",
  "desc": "细白边框 + 底部优雅署名",
  "coverUrl": "https://cdn.example.com/covers/minimal-white.jpg",
  "canvasRatio": 1.3333,
  "elements": [
    {
      "id": "el-1746680000001",
      "type": "text",
      "x": 30,
      "y": 261,
      "width": 300,
      "height": 54,
      "zIndex": 100,
      "rx": 0.05,
      "ry": 0.87,
      "rw": 0.50,
      "rh": 0.09,
      "textProps": {
        "content": "My Story",
        "fontFamily": "Georgia",
        "fontSize": 18,
        "fontWeight": "normal",
        "fontStyle": "italic",
        "letterSpacing": 2,
        "color": "#888888",
        "useGradient": false,
        "gradientFrom": "#888888",
        "gradientTo": "#bbbbbb",
        "gradientAngle": 90,
        "strokeColor": "#000000",
        "strokeWidth": 0,
        "shadowColor": "#000000",
        "shadowBlur": 0,
        "shadowOffsetX": 0,
        "shadowOffsetY": 0
      }
    },
    {
      "id": "el-1746680000002",
      "type": "image",
      "x": 0,
      "y": 0,
      "width": 600,
      "height": 450,
      "zIndex": 50,
      "rx": 0,
      "ry": 0,
      "rw": 1,
      "rh": 1,
      "src": "https://cdn.example.com/elements/photo.jpg",
      "opacity": 1,
      "flipX": false,
      "flipY": false,
      "borderRadius": 0
    },
    {
      "id": "el-1746680000003",
      "type": "image-placeholder",
      "x": 0,
      "y": 0,
      "width": 600,
      "height": 450,
      "zIndex": 10,
      "rx": 0,
      "ry": 0,
      "rw": 1,
      "rh": 1
    }
  ]
}
```

### 2.2 字段说明

**模板顶层字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 模板唯一 ID，保存到 DB 后用数据库主键替换 |
| `label` | string | 模板名称 |
| `desc` | string | 副标题 / 简短描述 |
| `coverUrl` | string | 封面缩略图 CDN 地址 |
| `canvasRatio` | number | 画布宽高比，如 `4/3 = 1.3333` |
| `elements` | array | 元素列表，按 `zIndex` 从低到高渲染 |

**元素通用字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 元素 ID（运行时生成，**不存库**） |
| `type` | `"text"` \| `"image"` \| `"image-placeholder"` | 元素类型 |
| `rx/ry/rw/rh` | number (0~1) | 相对画布的比例坐标，应用时乘以实际宽高 |
| `x/y/width/height` | number | 运行时像素坐标（由 `r*` 计算而来，**不存库**） |
| `zIndex` | number | 层叠顺序 |

**文字元素 `textProps` 字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `content` | string | 文字内容 |
| `fontFamily` | string | 字体名称 |
| `fontSize` | number | 字号（px） |
| `fontWeight` | string | 字重，如 `"normal"` / `"bold"` / `"600"` |
| `fontStyle` | string | 斜体，`"normal"` 或 `"italic"` |
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

**图片元素额外字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `src` | string | 图片 CDN URL（存库前必须将 base64 替换为 URL） |
| `opacity` | number | 透明度（0~1） |
| `flipX` | boolean | 水平翻转 |
| `flipY` | boolean | 垂直翻转 |
| `borderRadius` | number | 圆角（px） |

### 2.3 前端上传 Payload（保存模板接口）

```json
POST /api/system-templates
Content-Type: application/json

{
  "label": "极简白框",
  "desc": "细白边框 + 底部优雅署名",
  "coverUrl": "https://cdn.example.com/covers/xxx.jpg",
  "templateContent": {
    "canvasRatio": 1.3333,
    "elements": [
      {
        "type": "text",
        "rx": 0.05, "ry": 0.87, "rw": 0.50, "rh": 0.09,
        "zIndex": 100,
        "textProps": {
          "content": "My Story",
          "fontFamily": "Georgia",
          "fontSize": 18,
          "fontWeight": "normal",
          "fontStyle": "italic",
          "letterSpacing": 2,
          "color": "#888888",
          "useGradient": false,
          "gradientFrom": "#888888",
          "gradientTo": "#bbbbbb",
          "gradientAngle": 90,
          "strokeColor": "#000000",
          "strokeWidth": 0,
          "shadowColor": "#000000",
          "shadowBlur": 0,
          "shadowOffsetX": 0,
          "shadowOffsetY": 0
        }
      },
      {
        "type": "image",
        "rx": 0, "ry": 0, "rw": 1, "rh": 1,
        "zIndex": 50,
        "src": "https://cdn.example.com/elements/photo.jpg",
        "opacity": 1,
        "flipX": false,
        "flipY": false,
        "borderRadius": 0
      }
    ]
  }
}
```

> ⚠️ **注意**：`x/y/width/height`（运行时像素坐标）**不需要存库**，应用模板时由前端根据 `rx/ry/rw/rh` 乘以当前画布尺寸动态计算。元素的 `id` 字段也是运行时生成的，不存库，应用时由前端统一生成新的 `id`。

---

## 三、服务端数据及结构

### 3.1 接口清单

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/api/system-templates` | 新增系统模板（管理员） |
| `GET` | `/api/system-templates` | 获取全部系统模板列表 |
| `PUT` | `/api/system-templates/:id` | 更新系统模板（管理员） |
| `DELETE` | `/api/system-templates/:id` | 删除系统模板（管理员） |
| `POST` | `/api/upload/image` | 上传图片，返回 CDN URL |

### 3.2 新增模板 Request / Response

**Response 结构：**

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "label": "极简白框",
    "desc": "细白边框 + 底部优雅署名",
    "coverUrl": "https://cdn.example.com/covers/xxx.jpg",
    "templateContent": {
      "canvasRatio": 1.3333,
      "elements": [...]
    },
    "sortOrder": 0,
    "status": 1,
    "createdAt": "2025-05-08T10:00:00Z",
    "updatedAt": "2025-05-08T10:00:00Z"
  }
}
```

### 3.3 获取列表 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "label": "极简白框",
      "desc": "细白边框 + 底部优雅署名",
      "coverUrl": "https://cdn.example.com/covers/xxx.jpg",
      "templateContent": {
        "canvasRatio": 1.3333,
        "elements": [...]
      },
      "sortOrder": 0,
      "status": 1,
      "createdAt": "2025-05-08T10:00:00Z"
    }
  ]
}
```

### 3.4 服务端参数校验规则

| 字段 | 校验规则 |
|------|----------|
| `label` | 必填，长度 1~50 字符 |
| `desc` | 可选，最长 200 字符 |
| `coverUrl` | 可选，合法 URL 格式 |
| `templateContent` | 必填，合法 JSON；`elements` 为数组，每个元素 `type` 必须为 `text/image/image-placeholder`；`rx/ry/rw/rh` 值范围 0~1 |

---

## 四、数据库表结构设计

### 4.1 系统模板表 `system_template`

```sql
CREATE TABLE `system_template` (
  -- 主键
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT    COMMENT '主键 ID',

  -- 核心业务字段
  `label`            VARCHAR(50)     NOT NULL                   COMMENT '模板名称',
  `desc`             VARCHAR(200)    NOT NULL DEFAULT ''        COMMENT '副标题 / 简短描述',
  `template_content` JSON            NOT NULL                   COMMENT '模板内容（大 JSON）',

  -- 扩展字段
  `cover_url`        VARCHAR(500)    NOT NULL DEFAULT ''        COMMENT '封面缩略图 CDN 地址',
  `sort_order`       INT             NOT NULL DEFAULT 0         COMMENT '排列顺序，越小越靠前',
  `status`           TINYINT         NOT NULL DEFAULT 1         COMMENT '状态：1=启用 / 0=禁用',
  `created_by`       VARCHAR(64)     NOT NULL DEFAULT ''        COMMENT '创建人（管理员账号）',
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP                         COMMENT '创建时间',
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统模板表';
```

### 4.2 `template_content` JSON 存库格式示例

```json
{
  "canvasRatio": 1.3333,
  "elements": [
    {
      "type": "text",
      "rx": 0.05,
      "ry": 0.87,
      "rw": 0.50,
      "rh": 0.09,
      "zIndex": 100,
      "textProps": {
        "content": "My Story",
        "fontFamily": "Georgia",
        "fontSize": 18,
        "fontWeight": "normal",
        "fontStyle": "italic",
        "letterSpacing": 2,
        "color": "#888888",
        "useGradient": false,
        "gradientFrom": "#888888",
        "gradientTo": "#bbbbbb",
        "gradientAngle": 90,
        "strokeColor": "#000000",
        "strokeWidth": 0,
        "shadowColor": "#000000",
        "shadowBlur": 0,
        "shadowOffsetX": 0,
        "shadowOffsetY": 0
      }
    },
    {
      "type": "image",
      "rx": 0.0,
      "ry": 0.0,
      "rw": 1.0,
      "rh": 1.0,
      "zIndex": 50,
      "src": "https://cdn.example.com/elements/photo.jpg",
      "opacity": 1,
      "flipX": false,
      "flipY": false,
      "borderRadius": 0
    }
  ]
}
```

> 🔑 **关键设计决策**：坐标只存 **比例值（rx/ry/rw/rh）**，不存像素值，这样模板可以适配任意画布尺寸，像素坐标由前端动态计算。

### 4.3 字段说明

| 列名 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGINT UNSIGNED | 是 | 自增主键，前端应用模板时作为唯一标识 |
| `label` | VARCHAR(50) | **是** | **模板名称**，展示在卡片标题 |
| `desc` | VARCHAR(200) | **是** | **副标题**，展示在模板卡片描述区 |
| `template_content` | JSON | **是** | **模板内容大 JSON**（见上方结构） |
| `cover_url` | VARCHAR(500) | 否 | 封面缩略图，列表页快速预览用 |
| `sort_order` | INT | 否 | 自定义排序权重，默认 0 |
| `status` | TINYINT | 否 | 1=上线 / 0=下线，下线后前端不展示 |
| `created_by` | VARCHAR(64) | 否 | 操作人账号，审计用 |
| `created_at` | DATETIME | 是 | 创建时间（自动填充） |
| `updated_at` | DATETIME | 是 | 最后修改时间（自动更新） |

### 4.4 索引设计

```sql
-- 列表查询：按状态筛选 + 排序，联合索引可完整覆盖 WHERE status=1 ORDER BY sort_order
KEY `idx_status_sort` (`status`, `sort_order`)
```

---

## 五、前端对接要点

1. **保存前预处理**：遍历 `elements`，将 `type === "image"` 且 `src` 为 base64 的元素，先并发上传图片换成 CDN URL，再序列化

2. **去掉运行时字段**：入库时过滤掉每个元素的 `id`、`x`、`y`、`width`、`height`（这些是运行时计算的），只保留 `rx/ry/rw/rh`

3. **应用模板时还原**：从库中取出 `template_content.elements`，用 `rx * canvasWidth` 计算出 `x/y/width/height`，并为每个元素生成新的 `id = el-${Date.now()}`

4. **替换 localStorage**：拉取系统模板时将接口数据替换掉 `useSystemTemplates` 中的 `FRAME_TEMPLATES` 常量兜底逻辑

5. **缓存策略**：系统模板列表变更频率低，可在前端加 5 分钟内存缓存，减少接口请求
