# 模块分析

> 生成时间: 2026-07-27T08:20:37.508Z
> 模块数: 89（已拆分为子文件）

## 目录结构

```tree
├── .github/
│   ├── workflows/
├── config/
├── scripts/
├── src/
│   ├── apps/
│   │   ├── createQR/
│   │   │   ├── model/
│   │   │   ├── pages/
│   │   ├── docList/
│   │   │   ├── model/
│   │   │   ├── pages/
│   │   │   │   ├── Anchor/
│   │   │   │   ├── List/
│   │   │   │   ├── Markdown/
│   │   ├── express/
│   │   │   ├── pages/
│   │   ├── home/
│   │   │   ├── pages/
│   │   │   │   ├── assets/
│   │   │   │   │   ├── svg/
│   │   ├── homeList/
│   │   │   ├── pages/
│   │   │   │   ├── assets/
│   │   │   │   │   ├── svg/
│   │   ├── imgWatermark/
│   │   │   ├── pages/
│   │   ├── jsonViewer/
│   │   │   ├── pages/
│   │   ├── login/
│   │   │   ├── assets/
│   │   │   ├── model/
│   │   ├── mermaid/
│   │   │   ├── pages/
│   │   │   │   ├── components/
│   │   ├── my/
│   │   │   ├── model/
│   │   │   ├── pages/
│   │   ├── note/
│   │   │   ├── model/
│   │   │   ├── pages/
│   │   ├── postmarkGenerator/
│   │   │   ├── canvas/
│   │   ├── productManage/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── model/
│   │   ├── reMark/
│   │   │   ├── pages/
│   │   │   │   ├── List/
│   │   ├── scanqr/
│   │   │   ├── pages/
│   │   ├── simpleSketches/
│   │   ├── tableConfig/
│   │   │   ├── components/
│   │   │   │   ├── ConfigBuilder/
│   │   │   │   ├── PageRenderer/
│   │   │   ├── styles/
│   │   │   ├── utils/
│   │   ├── timeCalculator/
│   │   │   ├── pages/
│   │   ├── tool/
│   │   │   ├── model/
│   │   │   ├── pages/
│   │   │   │   ├── Doc/
│   │   │   │   ├── List/
│   │   │   │   │   ├── assets/
│   │   ├── transcoderQR/
│   │   │   ├── pages/
│   │   ├── travelBadge/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   │   ├── appHeader/
│   │   │   │   ├── canvasArea/
│   │   │   │   ├── draggableElement/
│   │   │   │   ├── imagePanel/
│   │   │   │   ├── imagePropsEditor/
│   │   │   │   ├── panelTabs/
│   │   │   │   ├── propsPanel/
│   │   │   │   ├── templatePanel/
│   │   │   │   ├── textPanel/
│   │   │   │   ├── textPropsEditor/
│   │   │   ├── docs/
│   │   │   ├── hooks/
│   │   │   ├── i18n/
│   │   │   ├── utils/
│   │   ├── urlCoder/
│   │   ├── wangEditor/
│   │   │   ├── pages/
│   ├── assets/
│   │   ├── css/
│   │   ├── svg/
│   ├── axios/
│   ├── components/
│   │   ├── CardList/
│   │   ├── Container/
│   │   ├── Empty/
│   │   ├── Fixed/
│   │   ├── Form/
│   │   ├── Header/
│   │   ├── HelpDrawer/
│   │   ├── ScanQr/
│   │   ├── ThemeToggle/
│   ├── hooks/
│   ├── utils/
```

## 模块列表

| 模块 | 文件数 | 总行数 |
|------|--------|--------|
| [config](./modules/config.md) | 2 | 166 |
| [(根目录)](./modules/root.md) | 4 | 298 (项目根目录，包含入口文件和全局配置...) |
| [scripts](./modules/scripts.md) | 4 | 659 |
| [src\apps\createQR](./modules/src-apps-createQR.md) | 2 | 22 |
| [src\apps\createQR\model](./modules/src-apps-createQR-model.md) | 1 | 617 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\createQR\pages](./modules/src-apps-createQR-pages.md) | 2 | 378 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\docList](./modules/src-apps-docList.md) | 2 | 22 |
| [src\apps\docList\model](./modules/src-apps-docList-model.md) | 2 | 85 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\docList\pages\Anchor](./modules/src-apps-docList-pages-Anchor.md) | 2 | 133 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\docList\pages\List](./modules/src-apps-docList-pages-List.md) | 2 | 519 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\docList\pages\Markdown](./modules/src-apps-docList-pages-Markdown.md) | 1 | 40 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\express](./modules/src-apps-express.md) | 2 | 24 |
| [src\apps\express\pages](./modules/src-apps-express-pages.md) | 2 | 391 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\home](./modules/src-apps-home.md) | 2 | 21 |
| [src\apps\home\pages](./modules/src-apps-home-pages.md) | 3 | 1119 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\homeList](./modules/src-apps-homeList.md) | 2 | 21 |
| [src\apps\homeList\pages](./modules/src-apps-homeList-pages.md) | 1 | 44 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\imgWatermark](./modules/src-apps-imgWatermark.md) | 2 | 21 |
| [src\apps\imgWatermark\pages](./modules/src-apps-imgWatermark-pages.md) | 2 | 631 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\jsonViewer](./modules/src-apps-jsonViewer.md) | 2 | 21 |
| [src\apps\jsonViewer\pages](./modules/src-apps-jsonViewer-pages.md) | 2 | 663 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\login](./modules/src-apps-login.md) | 3 | 131 (样式模块，定义组件样式...) |
| [src\apps\login\model](./modules/src-apps-login-model.md) | 3 | 58 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\mermaid](./modules/src-apps-mermaid.md) | 2 | 21 |
| [src\apps\mermaid\pages\components](./modules/src-apps-mermaid-pages-components.md) | 2 | 103 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\mermaid\pages](./modules/src-apps-mermaid-pages.md) | 3 | 421 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\my](./modules/src-apps-my.md) | 2 | 21 |
| [src\apps\my\model](./modules/src-apps-my-model.md) | 4 | 120 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\my\pages](./modules/src-apps-my-pages.md) | 2 | 143 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\note](./modules/src-apps-note.md) | 2 | 21 |
| [src\apps\note\model](./modules/src-apps-note-model.md) | 2 | 37 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\note\pages](./modules/src-apps-note-pages.md) | 1 | 42 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\postmarkGenerator](./modules/src-apps-postmarkGenerator.md) | 4 | 573 (样式模块，定义组件样式...) |
| [src\apps\postmarkGenerator\canvas](./modules/src-apps-postmarkGenerator-canvas.md) | 1 | 525 |
| [src\apps\productManage](./modules/src-apps-productManage.md) | 2 | 22 |
| [src\apps\productManage\components](./modules/src-apps-productManage-components.md) | 7 | 703 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\productManage\model](./modules/src-apps-productManage-model.md) | 1 | 7 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\reMark](./modules/src-apps-reMark.md) | 2 | 21 |
| [src\apps\reMark\pages\List](./modules/src-apps-reMark-pages-List.md) | 2 | 258 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\scanqr](./modules/src-apps-scanqr.md) | 2 | 24 |
| [src\apps\scanqr\pages](./modules/src-apps-scanqr-pages.md) | 1 | 19 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\simpleSketches](./modules/src-apps-simpleSketches.md) | 3 | 362 (样式模块，定义组件样式...) |
| [src\apps\tableConfig](./modules/src-apps-tableConfig.md) | 2 | 95 |
| [src\apps\tableConfig\components](./modules/src-apps-tableConfig-components.md) | 1 | 158 (组件模块，提供可复用的 UI 组件...) |
| [src\apps\tableConfig\components\ConfigBuilder](./modules/src-apps-tableConfig-components-ConfigBuilder.md) | 3 | 1212 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\tableConfig\components\PageRenderer](./modules/src-apps-tableConfig-components-PageRenderer.md) | 4 | 996 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\tableConfig\styles](./modules/src-apps-tableConfig-styles.md) | 1 | 98 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\tableConfig\utils](./modules/src-apps-tableConfig-utils.md) | 2 | 779 (工具函数模块，提供通用辅助方法...) |
| [src\apps\timeCalculator](./modules/src-apps-timeCalculator.md) | 2 | 21 |
| [src\apps\timeCalculator\pages](./modules/src-apps-timeCalculator-pages.md) | 2 | 116 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\tool](./modules/src-apps-tool.md) | 2 | 37 |
| [src\apps\tool\model](./modules/src-apps-tool-model.md) | 2 | 28 (数据层模块，负责状态管理和 API 交互...) |
| [src\apps\tool\pages\Doc](./modules/src-apps-tool-pages-Doc.md) | 1 | 34 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\tool\pages](./modules/src-apps-tool-pages.md) | 1 | 29 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\tool\pages\List](./modules/src-apps-tool-pages-List.md) | 1 | 84 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\transcoderQR](./modules/src-apps-transcoderQR.md) | 2 | 21 |
| [src\apps\transcoderQR\pages](./modules/src-apps-transcoderQR-pages.md) | 1 | 148 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\api](./modules/src-apps-travelBadge-api.md) | 2 | 126 |
| [src\apps\travelBadge](./modules/src-apps-travelBadge.md) | 3 | 878 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\appHeader](./modules/src-apps-travelBadge-components-appHeader.md) | 2 | 308 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\canvasArea](./modules/src-apps-travelBadge-components-canvasArea.md) | 2 | 333 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\draggableElement](./modules/src-apps-travelBadge-components-draggableElement.md) | 2 | 611 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\imagePanel](./modules/src-apps-travelBadge-components-imagePanel.md) | 2 | 151 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\imagePropsEditor](./modules/src-apps-travelBadge-components-imagePropsEditor.md) | 1 | 102 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\panelTabs](./modules/src-apps-travelBadge-components-panelTabs.md) | 2 | 124 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\propsPanel](./modules/src-apps-travelBadge-components-propsPanel.md) | 2 | 425 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\templatePanel](./modules/src-apps-travelBadge-components-templatePanel.md) | 2 | 949 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\textPanel](./modules/src-apps-travelBadge-components-textPanel.md) | 2 | 609 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\components\textPropsEditor](./modules/src-apps-travelBadge-components-textPropsEditor.md) | 1 | 327 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\hooks](./modules/src-apps-travelBadge-hooks.md) | 6 | 606 |
| [src\apps\travelBadge\i18n](./modules/src-apps-travelBadge-i18n.md) | 4 | 430 (页面模块，主要负责 UI 展示和路由...) |
| [src\apps\travelBadge\utils](./modules/src-apps-travelBadge-utils.md) | 6 | 1029 (工具函数模块，提供通用辅助方法...) |
| [src\apps\urlCoder](./modules/src-apps-urlCoder.md) | 2 | 142 |
| [src\apps\wangEditor](./modules/src-apps-wangEditor.md) | 2 | 21 |
| [src\apps\wangEditor\pages](./modules/src-apps-wangEditor-pages.md) | 2 | 214 (页面模块，主要负责 UI 展示和路由...) |
| [src\assets\css](./modules/src-assets-css.md) | 2 | 1298 (静态资源目录，包含图片、样式等文件...) |
| [src\axios](./modules/src-axios.md) | 1 | 126 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\CardList](./modules/src-components-CardList.md) | 2 | 159 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\Container](./modules/src-components-Container.md) | 2 | 36 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\Empty](./modules/src-components-Empty.md) | 2 | 18 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\Fixed](./modules/src-components-Fixed.md) | 2 | 111 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\Form](./modules/src-components-Form.md) | 2 | 48 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\Header](./modules/src-components-Header.md) | 2 | 72 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\HelpDrawer](./modules/src-components-HelpDrawer.md) | 2 | 62 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\ScanQr](./modules/src-components-ScanQr.md) | 1 | 98 (页面模块，主要负责 UI 展示和路由...) |
| [src\components\ThemeToggle](./modules/src-components-ThemeToggle.md) | 1 | 70 (页面模块，主要负责 UI 展示和路由...) |
| [src\hooks](./modules/src-hooks.md) | 2 | 167 |
| [src](./modules/src.md) | 1 | 87 (页面模块，主要负责 UI 展示和路由...) |
| [src\utils](./modules/src-utils.md) | 7 | 338 (页面模块，主要负责 UI 展示和路由...) |

