/**
 * MarkdownActions 公共组件类型定义
 * docList / project 等 Markdown 文档页面共用的操作组件类型
 */

/** 复制内容类型 */
export type CopyType = 'html' | 'markdown';

/** 列表项最小结构（文章/文档通用） */
export interface ListItem {
  id: string;
  title: string;
}

/** PC 端列表收起/展开按钮组件 Props */
export interface CollapseToggleProps {
  listCollapsed: boolean;
  onToggle: () => void;
  styles: Record<string, string>;
}

/** 文档/文章列表面板组件 Props */
export interface PageListProps {
  items: ListItem[];
  activeId: string;
  onItemClick: (item: ListItem) => void;
  styles: Record<string, string>;
}

/** PC 端可收起的列表面板容器 Props */
export interface DocListPanelProps extends PageListProps {
  /** 是否展开（className 切换实现收起/展开动画） */
  visible: boolean;
}

/** Markdown 内容区容器 Props：children 以 render-prop 接收是否有内容，由页面决定渲染内容组件或 Empty */
export interface DocContentProps {
  hasContent: boolean;
  children: (hasContent: boolean) => React.ReactNode;
  styles: Record<string, string>;
}

/** 移动端列表抽屉 Props */
export interface MobileListDrawerProps extends PageListProps {
  open: boolean;
  /** 抽屉标题，移动端才展示 */
  title: string;
  onClose: () => void;
}

/** 操作按钮 key 前缀（用于埋点/测试定位，如 'docList-menu'、'project-menu'） */
export type ActionPrefix = string;

/** 视图派生计算入参 */
export interface DocViewInput {
  isMobile: boolean;
  hasMarkdown: boolean;
  hasHtml: boolean;
  /** 文章/文档总数，>1 才显示列表面板 */
  listCount: number;
  markdownInfo?: string;
  listCollapsed: boolean;
  /** 分享模式（docList 专有），为 true 时隐藏 PC 列表面板 */
  isShareMode?: boolean;
}

/** 页面视图派生标志集合 */
export interface DocViewFlags {
  hasContent: boolean;
  hasMermaid: boolean;
  /** 是否有多篇文章/文档 */
  showList: boolean;
  /** PC 端是否显示列表面板（含分享模式判断） */
  showPcList: boolean;
  /** PC 端列表面板是否展开（用于 className 切换动画） */
  pageListVisible: boolean;
}

/** PC 端操作按钮组件 Props */
export interface ActionButtonsProps {
  /** 按钮 key 前缀，如 'docList-menu' */
  prefix: ActionPrefix;
  mermaidCollapsed: boolean;
  /** 传入则显示 mermaid 折叠/展开按钮 */
  onToggleMermaid?: () => void;
  onCopyContent: (type: CopyType) => void;
  /** 传入则显示打印按钮 */
  onPrintPage?: () => void;
  hasMermaid: boolean;
  styles: Record<string, string>;
}

/** 移动端左侧菜单组件 Props */
export interface MobileMenuProps {
  /** 埋点 className 前缀，如 'docList-menu' */
  prefix: ActionPrefix;
  menuVisible: boolean;
  onToggleMenu: () => void;
  onCopyContent: (type: CopyType) => void;
  /** 传入则显示文档列表按钮 */
  onOpenListMenu?: () => void;
  /** 传入则显示打印按钮 */
  onPrintPage?: () => void;
  /** 是否显示列表按钮（配合 onOpenListMenu） */
  hasList?: boolean;
  /** 分享模式：隐藏列表按钮 */
  isShareMode?: boolean;
  styles: Record<string, string>;
}
