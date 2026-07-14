# 公共模块抽离 & 组件优化 — 技术方案

## 一、现状分析

### 1.1 项目概况
- 基于 **React 18 + Webpack 5 + MobX + Ant Design** 的多页应用，共 23 个独立 App
- 使用 **Less** 作为样式方案，`.module.less` 实现 CSS Modules，`.global.less` 作为全局样式
- 构建产物通过 CDN externals 引用 React、ReactDOM、Antd、Mermaid 等核心库

### 1.2 已有公共模块评估

| 模块 | 路径 | 现状 |
|------|------|------|
| `Container` | `src/components/Container/` | 页面布局外壳，功能单一，可微调 |
| `Header` | `src/components/Header/` | 顶部导航栏，与 HelpDrawer 耦合，可优化 |
| `Fixed` | `src/components/Fixed/` | 浮动操作按钮，逻辑较杂，可拆分 |
| `HelpDrawer` | `src/components/HelpDrawer/` | 帮助抽屉，功能完整，可保留 |
| `CardList` | `src/components/CardList/` | 卡片列表组件，功能完整，可保留 |
| `Empty` | `src/components/Empty/` | 空状态组件，简单封装，可保留 |
| `Form` | `src/components/Form/` | 动态表单项，功能完整，可保留 |
| `ScanQr` | `src/components/ScanQr/` | 二维码扫描，功能完整，可保留 |

### 1.3 存在问题

1. **CSS 变量未系统化**：全局 less 中定义了 `@color-bg`、`@color-shadow` 等变量，但未提取为 CSS 自定义属性，且部分颜色值（`#61677c`、`#595959` 等）在各组件中硬编码重复
2. **全局样式引入冗余**：每个 app 和组件都手动 `@import` 或 `import` 全局 less，依赖关系混乱
3. **Mermaid 模块可复用性不足**：`useLoadMermaid` hook 已提取，但渲染逻辑（防抖、Panzoom、下载 SVG/PNG）仍内聚在 `MermaidPreview` 中，其他 App 无法复用
4. **部分 App 未使用公共组件**：`simpleSketches`、`postmarkGenerator` 等 App 自行实现了页面外壳（header + layout），与 `Container/Header` 组件功能重复
5. **SVG 图标分散**：back、home、share、help 等常用 SVG 在各 App 中重复维护
6. **工具方法分散**：`copy`、`openApp`、`message` 等操作在各 App 中重复调用模式
7. **缺少主题切换能力**：全局仅有一套浅色主题样式，不支持深色模式，无法跟随系统偏好

---

## 二、技术方案 & 执行步骤

### Step 1：CSS 变量系统化

**目标**：将全局 less 变量提取为 CSS 自定义属性（CSS Variables），并建立统一的主题变量体系。

**具体做法**：
- 在 `src/assets/css/` 下新建 `variables.css`（或 `variables.less`），定义全套 CSS 变量
- 将 `index.global.less` 中的硬编码值（`#61677c`、`#595959`、`#262626` 等）替换为变量引用
- 在 `index.global.less` 中通过 `:root {}` 注入 CSS 变量，确保全局可用
- 组件级 `module.less` 中优先使用 CSS 变量（`var(--color-text)`），而非 less 变量

**变量命名规范**：
- `--color-bg` / `--color-text` / `--color-primary` / `--color-shadow`
- `--font-family` / `--font-size-base`
- `--spacing-unit` / `--radius-base`
- `--shadow-sm` / `--shadow-md` / `--shadow-inset`

**影响范围**：
- `src/assets/css/index.global.less`
- 所有组件 `.module.less` 文件
- 各 App 中的独立样式文件

---

### Step 2（新增）：主题切换系统

**目标**：构建支持「浅色 / 深色 / 跟随系统」三档主题切换的完整基础设施，所有页面共享同一套主题机制。

**具体做法**：

#### 2.1 主题变量定义
- 在 `src/assets/css/variables.css` 中定义两套主题色值：
  - `[data-theme="light"]` / `:root`：浅色主题（与现有颜色一致，保证零回归）
  - `[data-theme="dark"]`：深色主题（重新定义各色值）
- 使用 `prefers-color-scheme: dark` 媒体查询兜底跟随系统模式
- 与 Ant Design 5 的 `ConfigProvider` 主题联动，通过 `theme={{ algorithm: theme.darkAlgorithm }}` 同步组件级主题

#### 2.2 useTheme Hook
- 新建 `src/hooks/useTheme.js`，提供：
  - `theme`：当前主题值（`light` / `dark`）
  - `mode`：用户设定模式（`light` / `dark` / `system`）
  - `setMode(mode)`：切换设定模式
  - `isDark`：布尔值，方便条件渲染
- 核心逻辑：
  - 读取 `localStorage` 持久化用户偏好
  - 通过 `window.matchMedia('(prefers-color-scheme: dark)')` 监听系统变化
  - 设定 `document.documentElement.dataset.theme` 切换全局 CSS 变量
- 通过 React Context 全局注入，所有 App 共享同一主题状态

#### 2.3 ThemeToggle 组件
- 新建 `src/components/ThemeToggle/`，提供切换 UI
  - 三种模式对应三个图标：☀️ 浅色 / 🌙 深色 / 🌓 跟随系统
  - 点击轮换或使用下拉菜单（Dropdown）
  - 放置在 Header 右侧或 Fixed 浮动面板中
- 首次加载时根据 `localStorage` 或系统偏好自动设置初始主题
- 切换时同步更新 `document.documentElement.dataset.theme` 和 `ConfigProvider` 的 `theme` prop

#### 2.4 入口集成
- 在各 App 的 `main.jsx` 中注入 `ThemeProvider`（Context Provider）
- 在各 App 的根组件中包裹 `ConfigProvider` 并传入当前 `theme` 配置
- `src/index.ejs` 中添加内联脚本，在页面加载前读取 `localStorage` 设置 `data-theme`，避免首屏闪烁

#### 2.5 深色主题适配清单
- 全局样式 `index.global.less` 中所有颜色引用改为 CSS 变量
- 各组件 `.module.less` 中的硬编码颜色（`#61677c`、`#595959`、`#262626` 等）替换为 CSS 变量
- 各 App 独立样式中的颜色值逐一排查替换
- 特殊场景：`box-shadow` 的 neumorphic 风格在深色下需调整方向或透明度
- Mermaid 图表主题自动跟随系统主题传递

**收益**：全站一键切换深色/浅色，提升用户体验，降低长时间使用的视觉疲劳。

---

### Step 3：全局样式引入规范化

**目标**：消除重复的 `@import`/`import` 全局样式，统一由 Webpack 或入口文件注入。

**具体做法**：
- 在 `webpack.config.js` 中通过 `MiniCssExtractPlugin` 或 `style-loader` 自动注入全局 CSS
- 或通过每个 App 的 `main.jsx` 入口文件统一引入一次 `@assets/css/index.global.less`
- 移除组件和各 App 中冗余的 `@import '../../assets/css/index.global.less'` 语句

**排查清单**（需移除冗余 import 的文件）：
- `src/components/Container/index.module.less`
- `src/components/Header/index.module.less`
- `src/components/Fixed/index.module.less`
- `src/components/CardList/index.module.less`
- `src/apps/homeList/pages/List.jsx`
- `src/apps/note/pages/List.jsx`
- `src/apps/urlCoder/app.jsx`
- `src/apps/mermaid/pages/List.jsx`
- `src/apps/mermaid/pages/index.module.less`

---

### Step 4：Mermaid 模块抽离

**目标**：将 Mermaid 渲染、交互、导出能力封装为可复用组件，供其他 App 使用。

**具体做法**：
- 新建 `src/components/MermaidRenderer/` 组件
  - 提取 `MermaidPreview` 中的渲染逻辑（防抖渲染、Panzoom、全屏）
  - 提取 SVG/PNG 导出能力
  - 提取主题切换能力，自动感知当前主题并传递给 `mermaid.initialize({ theme })`
  - 暴露 props：`source`、`theme`（可选，默认跟随系统主题）、`className` 等
- 优化 `useLoadMermaid` hook
  - 增加重试机制
  - 支持自定义初始化配置
- 旧 `src/apps/mermaid/pages/components/MermaidPreview.jsx` 改为包装新组件
- 保证拖拽、全屏等功能正常，以 `src/apps/docList/pages/Markdown/renderMermaid.jsx` 作为改造源，确保功能不受影响
- 注意：`docList` 中的 `renderMermaid.jsx` 引入了 `useLoadMermaid` 且自行管理了 Panzoom、全屏、展开/收起等逻辑，抽离后需保证 `MermaidBlock` 的交互完整性

**收益**：其他 App（如 `note`、`docList` 等需要渲染图表的页面）可复用 Mermaid 渲染能力，且自动适配主题。

---

### Step 5：公共组件优化

**目标**：打磨现有 6 个公共组件，提升可用性和一致性。

#### 5.1 Container 组件
- 增加 `className` prop 支持自定义样式扩展
- 优化 `main` 区域的滚动行为，支持 `overflow: overlay`

#### 5.2 Header 组件
- 解耦 HelpDrawer：通过 `rightComponent` prop 注入，而非内部硬编码
- 增加 `title` prop 替代 `name`，保持命名一致性（兼容旧 `name`）
- 增加 `className`、`style` 扩展支持
- 右侧预留主题切换按钮插槽

#### 5.3 Fixed 组件
- 拆分按钮配置为 `actions` prop，由外部传入按钮列表
- 保留默认的 home / share 按钮作为默认配置
- 增加 `position` 支持（`left`/`right`）

#### 5.4 HelpDrawer 组件
- 功能基本完善，保持现状
- 微调：增加 `placement` prop 支持（`bottom`/`right`）

---

### Step 6：统一 SVG 图标管理

**目标**：消除重复的 SVG 图标文件，建立统一图标库。

**具体做法**：
- 新建 `src/assets/svg/` 目录，集中存放所有通用 SVG
  - `back.svg`、`home.svg`、`share.svg`、`help.svg`、`note.svg`、`tool.svg` 等
  - 新增 `theme-light.svg`、`theme-dark.svg`、`theme-system.svg` 主题图标
- 移除各 App 和组件中重复的 SVG 副本
- 更新引用路径到 `@assets/svg/` 别名

**涉及文件**：
- `src/components/Header/assets/svg/back.svg`
- `src/components/Fixed/assets/svg/home.svg`
- `src/components/Fixed/assets/svg/share.svg`
- `src/components/HelpDrawer/assets/svg/help.svg`
- `src/apps/homeList/pages/assets/svg/*.svg`
- 以及其他各 App 中的 SVG 副本

---

### Step 7：公共方法抽离

**目标**：抽取各 App 中高频重复的逻辑片段为公共工具方法。

**具体做法**：
- 在 `src/utils/` 下新增：
  - `share.js`：分享当前页面链接（`copy + message` 模式）
  - `download.js`：通用下载 Blob/URL 工具
  - `canvas.js`：canvas 相关工具（dataURL、blob 转换等）
  - `debounce.js`：防抖工具（若未在 methods-r 中提供）
- 确保 `src/utils/index.js` 统一导出所有工具方法

---

### Step 8：未使用公共组件的 App 改造

**目标**：让 `simpleSketches`、`postmarkGenerator` 等 App 改用 `Container + Header + Fixed` 组件，消除手写页面外壳。

**具体做法**：
- `simpleSketches/app.jsx` → 用 `<Container header={<Header />} main={...} />` + `<Fixed />` 替换手写 layout
- `postmarkGenerator/app.jsx` → 同上
- 改造过程需确保不影响现有功能 UI

---

### Step 9：Webpack 配置优化（可选）

**目标**：进一步优化 splitChunks 策略，确保公共模块被正确提取。

**具体做法**：
- 取消注释 `webpack.config.js` 中 `antd` / `react` / `mobx` 的 cacheGroups 配置（按需）
- 确保 `common` cacheGroup 能正确识别 `src/components/`、`src/utils/`、`src/hooks/` 等公共模块

---

## 三、执行优先级 & 依赖关系

```
Phase 1（基础建设）
  ├── Step 1: CSS 变量系统化（无依赖）
  ├── Step 2: 主题切换系统（依赖 Step 1，CSS 变量是主题切换的基础）
  └── Step 7: 公共方法抽离（无依赖）

Phase 2（样式与引入优化）
  ├── Step 3: 全局样式引入规范化（依赖 Step 1）
  └── Step 6: 统一 SVG 图标管理（无依赖）

Phase 3（组件打磨）
  ├── Step 5: 公共组件优化（依赖 Step 1-2，Header 需预留主题插槽）
  └── Step 4: Mermaid 模块抽离（依赖 Step 5 的 Container 优化 + Step 2 的主题联动）

Phase 4（应用改造）
  ├── Step 8: App 改造（依赖 Step 5）
  └── Step 9: Webpack 配置优化（依赖 Phase 1-3 完成）
```

---

## 四、注意事项

1. **CSS 变量兼容性**：目标浏览器为现代浏览器（Chrome 90+、Safari 14+），CSS 变量均可用。如有兼容需求，less 变量可保留为 fallback
2. **主题切换与 Ant Design 联动**：Ant Design 5 的 `ConfigProvider` 需接收 `theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}`，确保组件库同时切换
3. **首屏防闪烁**：`index.ejs` 中需添加内联脚本在 DOM 解析前设置 `data-theme`，避免浅色主题闪一下再变深色
4. **样式回归**：每一阶段完成后需 `npm run build` 全量构建，对比 UI 变化
5. **增量改造**：优先改造高频使用的 App（tool、homeList、note、mermaid），低频 App 可延后
6. **Mermaid 组件**：抽离后保持与现有 `useLoadMermaid` hook 的兼容，不破坏旧引用；`renderMermaid.jsx` 中的 `MermaidBlock` 交互逻辑需完整保留
7. **SVG 迁移**：使用 `git mv` 保留文件历史，避免直接删除后新建
8. **深色主题设计**：neumorphic 风格在深色背景下需调整阴影方向（由 `light` 改为 `dark` 阴影），避免在深色背景上出现突兀的亮色阴影
