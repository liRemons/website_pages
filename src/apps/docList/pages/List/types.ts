/**
 * List 模块类型定义
 * 集中管理文档列表页面的所有 TypeScript 类型
 */

/** 锚点目录项（树形结构，支持嵌套子目录） */
export interface AnchorItem {
  title: string;
  children: AnchorItem[];
}

/** 文章列表项 */
export interface ArticleItem {
  id: string;
  title: string;
  techClassName: string;
}

/** 复制内容类型 */
export type CopyType = 'html' | 'markdown';

/** 抽屉面板类型：文章列表 / 导航 / 空 */
export type DrawerType = 'list' | 'nav' | '';

/** 文档列表 Store 接口（MobX 状态） */
export interface DocListStore {
  articleList: ArticleItem[];
  markdownInfo: string;
  htmlInfo: string;
  anchor: AnchorItem[];
  title: string;
  createTime: string;
  techClassName: string;
  queryArticleList: (payload: { techClassId?: string; websiteRole: string }) => Promise<void>;
  getMarkdown: (id: string) => Promise<void>;
}

/** 操作按钮组件 Props */
export interface ActionButtonsProps {
  mermaidCollapsed: boolean;
  onToggleMermaid: () => void;
  onCopyContent: (type: CopyType) => void;
  onPrintPage: () => void;
  hasMermaid: boolean;
  styles: Record<string, string>;
}

/** 文章列表面板组件 Props */
export interface PageListProps {
  articleList: ArticleItem[];
  activeId: string;
  onPageClick: (item: ArticleItem) => void;
  styles: Record<string, string>;
}

/** 导航面板组件 Props */
export interface PageNavProps {
  anchor: AnchorItem[];
  htmlInfo: string;
  onSearch: (title: string) => void;
  styles: Record<string, string>;
}

/** 移动端菜单项类型 */
export interface MenuItem {
  className: string;
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  isShow?: boolean;
}

/** 移动端左侧菜单组件 Props */
export interface MobileMenuProps {
  menuVisible: boolean;
  onToggleMenu: () => void;
  onOpenListMenu: () => void;
  onOpenListNav: () => void;
  onCopyContent: (type: CopyType) => void;
  onPrintPage: () => void;
  hasAnchor: boolean;
  hasMultipleArticles: boolean;
  styles: Record<string, string>;
}

/** PC 端列表收起/展开按钮组件 Props */
export interface CollapseToggleProps {
  listCollapsed: boolean;
  onToggle: () => void;
  styles: Record<string, string>;
}