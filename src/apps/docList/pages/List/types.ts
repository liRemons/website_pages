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

/** 抽屉面板类型：文章列表 / 导航 / 空 */
export type DrawerType = 'list' | '';

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

/** 导航面板组件 Props */
export interface PageNavProps {
  anchor: AnchorItem[];
  htmlInfo: string;
  onSearch: (title: string) => void;
  styles: Record<string, string>;
  originAnchor: AnchorItem[];
}