/**
 * List 模块类型定义
 * 集中管理项目文档列表页面的所有 TypeScript 类型
 */

/** 文档列表项 */
export interface DocItem {
  id: string;
  title: string;
}

/** 文档列表面板组件 Props */
export interface PageListProps {
  docList: DocItem[];
  activeDocId: string;
  onDocClick: (item: DocItem) => void;
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
  hasMultipleDocs: boolean;
  styles: Record<string, string>;
}

/** PC 端列表收起/展开按钮组件 Props */
export interface CollapseToggleProps {
  listCollapsed: boolean;
  onToggle: () => void;
  styles: Record<string, string>;
}