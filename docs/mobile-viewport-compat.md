# 移动端浏览器兼容：地址栏收起导致页面顶部被遮挡

> 本文描述的是**移动端 Web 通用问题**，不针对某个具体项目；最后一节给出与本仓库的对应关系，便于对照。
> 适用场景：H5 页面、内嵌 WebView、小程序 web-view、企业微信/钉钉等基于系统 WebView 的容器。

---

## 一、现象

用户能稳定复现的一组症状，通常出现在「列表滚到最底部之后」：

1. 列表已经到底，继续向上滑动（手指上滑 = 内容继续向下滚动）。
2. 浏览器顶部的地址栏 / 工具栏**收起或展开**，可滚动区域高度随之变化。
3. 页面整体被"顶"了一下：顶部固定区（标题栏、吸顶筛选条）被浏览器 UI 盖住，或下方露出一截空白。
4. 必须把页面滑回**最顶部**才能恢复正常展示；点一下地址栏再收起也可能恢复，但会再次复发。
5. 伴随症状（同一根因）：吸顶元素跳到错误位置、底部出现空白、输入框聚焦时页面跳动、`scrollTo(0,0)` 之后仍差几十像素。

iOS Safari、Android Chrome、以及大部分国产浏览器（Blink/WebKit 内核）都会出现，只是触发难度不同。

---

## 二、背景：移动端到底有几个"视口"

理解这个问题必须先区分三样东西：

| 概念 | 含义 | 谁在用 |
|---|---|---|
| **布局视口**（layout viewport） | 页面排版用的高度，随浏览器工具栏收/展而变化 | `position: fixed`、百分比高度、媒体查询 |
| **可视视口**（visual viewport） | 用户此刻真正能看到的那块区域（含双指缩放） | `window.visualViewport` |
| **大 / 小视口** | 大视口 = 工具栏收起后的高度；小视口 = 工具栏展开时的高度 | `100vh`（= 大视口）、`100svh`（= 小视口） |

关键结论：

- **`100vh` 在移动端 = 大视口**，也就是"地址栏收起之后"的高度。地址栏展开时，可视区比 `100vh` **矮 50~60px**（不同浏览器略有差异）。
- 因此任何"用 `100vh` 表示当前屏幕高度"的写法，在地址栏展开的瞬间就**高出了一截**。
- 高出来的这一截让 `document` 变成可滚动的 —— 即使你的内容明明一屏放得下。这就是所谓的**幽灵滚动**（phantom scroll）。
- 一旦文档可滚，用户滑到底再滑，手势就会去滚文档；而浏览器"工具栏收起/展开"的动画正是由**文档滚动方向**驱动的。于是一个"只该由内层列表消费"的滑动，变成了"推动整页位移"。

浏览器工具栏是**覆盖**在页面上的（不是把你的内容挤下去），所以文档一移动，`position: absolute` 的顶层骨架就跟着移动，顶部内容自然钻到工具栏下面 —— 这就是"上方被遮挡"。

`position: fixed` 与 `absolute + height: 100%` 的差别也在这里：

| 写法 | 生效基准 | 地址栏收/展时 |
|---|---|---|
| `position: fixed; inset: 0` | 布局视口 | 跟着变大变小，**始终等于当前可见区域** |
| `position: absolute; height: 100%` | 初始包含块（≈大视口） | 高度不变，文档一旦滚动就整体偏移 |

---

## 三、根因归类

| 编号 | 根因 | 典型写法 | 后果 |
|---|---|---|---|
| A | 用 `100vh` 表示"当前屏幕高度" | `html, body { min-height: 100vh }`、`height: 100vh`、`calc(100vh - 60px)` | 高度比可视区大，产生幽灵滚动 |
| B | 滚动容器没有断链 | `overflow: auto` 却没写 `overscroll-behavior` | 滚到底后手势传给文档，触发工具栏动画 + 整页位移 |
| C | 顶层骨架用 `absolute + height: 100%` | 页面根容器 | 跟随文档偏移，顶部被浏览器 UI 盖住 |
| D | 底部锚定元素用 `top: calc(100vh - Npx)` | 右下角悬浮按钮、返回顶部 | 地址栏展开时跑到可视区之外，看不见 |
| E | 多层嵌套滚动 | 外层 `.main` 滚 + 内层列表再滚 | 链式滚动难以控制，手感"发飘" |
| F | 软键盘 | 输入框聚焦后页面跳动/被键盘遮挡 | 视口高度再次变化，同上逻辑 |

A、B、C 往往**同时存在**，只修一个仍然能复现 —— 这是这类问题"改了没用"的主要原因。

---

## 四、通用解决方案

### 1. 高度一律用动态视口单位 `dvh`，保留 `vh` 兜底

```css
html,
body {
  /* 老引擎不认 dvh 会忽略下面这行，行为与改动前一致 */
  min-height: 100vh;
  min-height: 100dvh;
}
```

`dvh` / `svh` / `lvh` 的选择：

- `dvh`（dynamic）：跟随工具栏实时变化，适合页面根容器、铺满屏幕的画布。**绝大多数场景用这个。**
- `svh`（small）：永远按"工具栏展开"的最小可视区算，适合"不想在工具栏收起时内容跳动"的场景。
- `lvh`（large）：等同于 `vh`，基本没有使用理由。

`calc()` 里同样适用：`height: calc(100dvh - 64px)`。

> 注意：只改 `html, body` 不够，页面内部任何"占满屏幕"的容器（根布局、画布、编辑器）都要一起换，否则外层锁死了、内层又撑出 56px。

### 2. 顶层骨架 `position: fixed; inset: 0`

```css
.app-shell {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
}
.app-shell .scroll-area {
  flex: 1;
  overflow: auto;
}
```

好处：骨架尺寸由"布局视口"决定，工具栏收/展时自动跟随；即使文档因为某些原因还能滚动几像素，骨架也不会跟着跑，顶部永远不会被盖。同时 `flex: 1 + overflow: auto` 天然形成"**只有一个滚动容器**"的结构（对应根因 E）。

### 3. 给每个滚动容器断开滚动链

```css
/* 内层滚动容器：滚到底后不再把手势交给父级/文档 */
.scroll-area {
  overflow: auto;
  overscroll-behavior-y: contain;
}

/* 文档级：禁掉回弹与下拉刷新抢手势 */
html,
body {
  overscroll-behavior-y: none;
}
```

`contain` = 到边界就停，不影响自身滚动；`none` = 连边界回弹效果也去掉。两者都能阻止"手势传递 → 文档滚动 → 工具栏动画"这条链路。

若页面里存在"横向轮播 + 纵向列表"，用 `overscroll-behavior-x: contain` 单独处理横向。

### 4. 底部锚定元素用 `bottom`，不要 `top: calc(100vh - N)`

```css
/* 反面写法：地址栏展开时，按钮会掉到可视区下方 */
.float-btn { position: fixed; top: calc(100vh - 38px); }

/* 推荐：与视口单位无关，永远贴底 */
.float-btn { position: fixed; bottom: 12px; }
```

### 5. viewport meta 与安全区

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

- `viewport-fit=cover`：让页面铺满刘海屏/圆角屏，**同时才使 `env(safe-area-inset-*)` 有值**（不加它读到的全是 0）。加了就必须给固定区补安全区，否则内容会钻到刘海/小白条下面：

```css
.top-bar   { padding-top: env(safe-area-inset-top); }
.bottom-bar{ padding-bottom: env(safe-area-inset-bottom); }
```

- `interactive-widget=resizes-content`：软键盘弹出时收缩布局视口（而不是只覆盖），`position: fixed` 的底栏与输入区表现更符合预期（Chrome 108+）。

### 6. 老浏览器兜底：`--vh` CSS 变量

`dvh` 的支持起点是 Chrome 108 / Safari 15.4 / Firefox 101。要覆盖更老的设备（iOS 14 及以下、部分国产内核），用 `innerHeight` 写一个 CSS 变量：

```js
function syncViewportVar() {
  // innerHeight 是当前可视高度（含地址栏状态），1% 即视口高度的 1%
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
syncViewportVar();
window.addEventListener('resize', syncViewportVar);
window.addEventListener('orientationchange', syncViewportVar);
// iOS 上还要监听 visualViewport，工具栏收/展不一定触发 resize
window.visualViewport?.addEventListener('resize', syncViewportVar);
```

```css
.legacy-full { height: calc(var(--vh, 1vh) * 100); }
```

`var(--vh, 1vh)` 的写法保证 JS 没跑起来时退回 `1vh`。

### 7. 需要精确像素时读 `visualViewport`

```js
const vv = window.visualViewport;
if (vv) {
  // 可视视口高度（排除工具栏、排除键盘）
  const visibleHeight = vv.height;
  // 页面因键盘或工具栏被"顶"上去的偏移量
  const offsetTop = vv.offsetTop;
}
```

注意：`window.innerHeight` 已包含工具栏收起后的高度；`document.documentElement.clientHeight` 是布局视口；`vv.height` 才是最贴近"用户看到的那块"。三者不要混用。

### 8. 键盘遮挡输入框

- 布局层面：容器高度用 `dvh` + 滚动容器 `overscroll-behavior: contain`，键盘弹出时容器缩、内容仍然可滚。
- 聚焦时补滚动（必要的话）：

```js
input.addEventListener('focus', () => {
  // 等键盘动画结束再滚动，否则位置会算错
  setTimeout(() => input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
});
```

### 9. 结构性约束（最容易被忽略）

- **一个页面只留一个滚动容器**。外层 `fixed inset: 0` + 内层 `flex:1; overflow:auto`，避免嵌套滚动链。
- 不要让 `body` 参与滚动：`body { margin: 0 }` 必须写，否则多出 8px 的滚动余量。
- 固定高度容器内部不要再写 `100vh`；改用 `100%`（父级已有确定高度时）。
- 弹窗/抽屉挂到 `body` 时要确认它们的定位基准没被 `transform` 改变（`transform` 会让 `fixed` 退化成 `absolute`）。

---

## 五、排查与验证清单

**静态检查（改代码前后都过一遍）**

- [ ] 全文搜索 `100vh`：除全屏 API（`&:fullscreen`）、打印样式外，是否都该换成 `dvh`？
- [ ] 所有 `overflow: auto/scroll` 的地方，是否都写了 `overscroll-behavior`？
- [ ] 页面根容器是 `fixed; inset: 0` 吗？（而不是 `absolute + height: 100%`）
- [ ] 是否只有一个滚动容器？嵌套的那一层能不能合并？
- [ ] 底部浮动元素是否用 `bottom` 定位？
- [ ] `viewport` meta 是否包含 `viewport-fit=cover`；加了之后固定区是否补了 `env(safe-area-inset-*)`？
- [ ] 输入框聚焦后，键盘是否遮挡内容？

**运行时自查（粘到控制台）**

```js
// 文档是否可滚（> 0 说明存在幽灵滚动）
const ghostScroll = document.documentElement.scrollHeight - window.innerHeight;
console.log('ghost scroll:', ghostScroll);

// 三种高度分别是多少
console.log({
  innerHeight: window.innerHeight,                       // 含工具栏状态的可视高度
  clientHeight: document.documentElement.clientHeight,    // 布局视口
  visualViewport: window.visualViewport?.height,          // 真实可见高度
});
```

**真机验证步骤**

1. 页面滑到底，继续向上滑 2~3 次：顶部固定区不应移动，不应被浏览器 UI 遮挡。
2. 上下快速滑动，观察工具栏收起/展开过程中固定区是否抖动。
3. 设备旋转后重复 1、2（旋转会重置工具栏状态）。
4. 键盘弹起再收起，检查底部按钮与输入框。
5. 刘海屏/圆角屏设备检查安全区（内容不能被圆角或小白条切掉）。

---

## 六、兼容性汇总

| 特性 | 支持起点 | 不支持时的表现 | 是否需要兜底 |
|---|---|---|---|
| `dvh` / `svh` / `lvh` | Chrome 108、Safari 15.4、Firefox 101 | 该行声明被忽略 | 保留 `vh` 兜底或 `--vh` |
| `overscroll-behavior` | Chrome 63、Safari 16 | 手势仍会传到文档 | 配 `fixed` 骨架 + `dvh` 一起用 |
| `env(safe-area-inset-*)` | iOS 11+（需 `viewport-fit=cover`） | 读到 0 | 无需兜底，退化即无内边距 |
| `visualViewport` | Chrome 61、Safari 13 | API 为 `undefined` | 用 `innerHeight` 兜底 |
| `interactive-widget` | Chrome 108 | 忽略，键盘仍为覆盖式 | 无 |

结论：**必须同时具备 `dvh`（或 `--vh`）兜底 + `fixed` 骨架 + `overscroll-behavior` 断链**，才能覆盖从 iOS 12 到最新版 Chrome 的全区间；只满足其中一项时，老设备仍会偶发复现。

---

## 七、常见误区

| 误区 | 为什么不对 |
|---|---|
| "加 `height: 100%` 就能铺满" | 百分比高度要有确定的父级高度；`html, body` 没有 `height` 时百分比无效 |
| "把 `100vh` 换成 `100%` 就解决了" | 父级高度若来自 `100vh`，等价于没改 |
| "只要 `position: fixed` 就万无一失" | 祖先有 `transform`/`filter`/`will-change` 时 `fixed` 会退化为相对祖先定位 |
| "禁用页面滚动就行" | `overflow: hidden` 加在错误层级（如内层）会把内容直接裁掉；要加在 `html, body` 或让骨架 `fixed` |
| "iOS 不需要处理，只有 Android 会收起地址栏" | 两种内核都会：iOS Safari 会缩放/覆盖可视视口，表现不同但同样导致 `100vh` 失真 |
| "用手势库拦截 touchmove 能解决" | 拦截 `touchmove` 会同时毁掉惯性滚动与无障碍滚动，且 `preventDefault` 在被动监听器里无效 |

---

## 八、本仓库的落地对照（示例，可跳过）

| 位置 | 做法 |
|---|---|
| `src/assets/css/index.global.less` | `html, body` 用 `min-height: 100vh` + `min-height: 100dvh`，并加 `overscroll-behavior-y: none` |
| `src/components/Container/index.module.less` | 页面骨架 `.container` 由 `absolute + height: 100%` 改为 `fixed; inset: 0`；`.main` 加 `overscroll-behavior-y: contain` |
| `src/assets/css/markdownPage.mixin.less` | 文档页根容器同样改 `fixed; inset: 0`；左下角收起按钮从 `top: calc(100vh - 38px)` 改为 `bottom: 12px`；TOC 侧栏 `max-height` 补 `dvh` |
| 各应用页面的 `100vh` | 统一补一条 `100dvh` 版本（login / postmarkGenerator / simpleSketches / tableConfig / travelBadge / jsonViewer / mermaid / wangEditor / docList Anchor 等） |

即：**骨架 fixed 铺满 + 高度 dvh + 滚动断链** 三件套，一次解决 19 个 Container 页面与其余自建骨架页面。
