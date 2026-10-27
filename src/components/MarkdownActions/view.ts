/**
 * computeDocView 页面视图派生计算（公共）
 * 收敛 docList / project 中同构的展示标志推导逻辑
 * 注意：入参可能来自 MobX observable，需在 useObserver 回调内调用以保持依赖追踪
 */
import { DocViewInput, DocViewFlags } from './types';

export default function computeDocView(input: DocViewInput): DocViewFlags {
  const { isMobile, hasMarkdown, hasHtml, listCount, markdownInfo, listCollapsed, isShareMode = false } = input;
  // 是否有 Markdown 和 HTML 内容
  const hasContent = !!hasMarkdown && !!hasHtml;
  // 是否有多篇文章/文档（决定是否显示列表面板）
  const showList = listCount > 1;
  // PC 端是否显示列表面板（docList 分享模式下隐藏）
  const showPcList = !isMobile && !isShareMode && showList;
  return {
    hasContent,
    // 内容是否包含 mermaid（决定是否显示 mermaid 折叠按钮）
    hasMermaid: !!markdownInfo?.includes('mermaid'),
    showList,
    showPcList,
    // 列表面板是否展开（className 切换实现收起/展开动画）
    pageListVisible: showPcList && !listCollapsed,
  };
}
