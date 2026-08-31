/**
 * List 文档列表页面
 * 功能：展示文章列表、Markdown 渲染、锚点导航、复制/打印、mermaid 折叠等
 * 支持 PC 端三栏布局和移动端 Drawer 抽屉模式
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useObserver, useLocalObservable } from 'mobx-react-lite';
import Empty from '@components/Empty';
import Header from '@components/Header';
import handleContent from '../../handle.md';
import Fixed from '@components/Fixed';
import store from '../../model/store';
import classnames from 'classnames';
import '@assets/css/index.global.less';
import style from './index.module.less';
import Markdown from '../Markdown';
import { Drawer } from 'antd';
import { getSearchParams, IsPC, debounce } from 'methods-r';
import copyContent from './hooks/copyContent';
import printPage from './hooks/printPage';
import ActionButtons from './components/ActionButtons';
import MobileMenu from './components/MobileMenu';
import CollapseToggle from './components/CollapseToggle';
import PageList from './components/PageList';
import PageNav from './components/PageNav';
import { AnchorItem, DrawerType } from './types';

/** 递归过滤锚点目录，保留标题包含搜索关键词的节点 */
const deepAnchor = (data: AnchorItem[], searchTitle: string): AnchorItem[] => {
  return data.filter(item => {
    if (item.title.toLocaleLowerCase().includes(searchTitle.toLocaleLowerCase())) return true;
    item.children = deepAnchor(item.children, searchTitle);
    return item.children.length > 0;
  });
};

/** 抽屉面板标题映射 */
const drawerTitleMap: Record<DrawerType, string> = {
  list: '文章列表',
  nav: '导航',
  '': '',
};

export default function List() {
  // MobX 本地状态，绑定全局 store
  const localStore = useLocalObservable(() => store);
  // URL 查询参数
  const [params, setParams] = useState<Record<string, string>>({});
  // 当前选中的文章 ID
  const [activeId, setActiveId] = useState('');
  // 锚点目录数据（用于搜索过滤）
  const [anchor, setAnchor] = useState<AnchorItem[]>([]);
  // 移动端 Drawer 显示状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 移动端 Drawer 面板类型：'list' 文章列表 / 'nav' 导航
  const [drawerType, setDrawerType] = useState<DrawerType>('');
  // 移动端左侧菜单显示状态（localStorage 持久化）
  const [menuVisible, setMenuVisible] = useState(localStorage.docListMenuVisible === 'true' || false);
  // PC 端文章列表面板收起状态（localStorage 持久化）
  const [listCollapsed, setListCollapsed] = useState(localStorage.docListListCollapsed === 'true');
  // mermaid 图表折叠状态（localStorage 持久化，默认展开）
  const [mermaidCollapsed, setMermaidCollapsed] = useState(localStorage.mermaidCollapsed !== 'false');

  // 复制和打印工具函数
  const { copyContent: doCopy } = copyContent(localStore);
  const { toPrintPage } = printPage(localStore);

  // 组件挂载时加载文章列表
  useEffect(() => {
    getList();
  }, []);

  /** 获取文章列表并初始化当前文章 */
  const getList = async () => {
    const params = getSearchParams();
    setParams(params);
    const { id: techClassId, pageId } = params;
    await localStore.queryArticleList({ techClassId, websiteRole: window.location.host });
    if (pageId) {
      // URL 指定了文章 ID，直接加载
      localStore.getMarkdown(pageId);
      setActiveId(pageId);
    } else if (localStore.articleList?.length) {
      // 未指定 ID，默认加载第一篇文章
      const info = localStore.articleList[0];
      localStore.getMarkdown(info.id);
      setActiveId(info.id);
    }
  };

  /** 点击文章列表项，切换当前文章并更新 URL */
  const handleClickPage = (data: { id: string }) => {
    const { id } = data;
    if (id === activeId) return;
    const newParams = new URLSearchParams({ ...getSearchParams(), pageId: id });
    const pageURL = newParams.toString() ? `/${APP_NAME}/docList?${newParams.toString()}` : `/${APP_NAME}/docList`;
    history.pushState('', '', pageURL);
    setActiveId(id);
    setDrawerVisible(false);
    localStore.getMarkdown(id);
  };

  /** 搜索锚点目录，空关键词时恢复完整目录（debounce 保持稳定引用） */
  const onSearch = useCallback(
    debounce((searchTitle: string) => {
      if (!searchTitle) {
        setAnchor(JSON.parse(JSON.stringify(localStore.anchor)));
      } else {
        setAnchor(deepAnchor(JSON.parse(JSON.stringify(localStore.anchor)), searchTitle));
      }
    }),
    []
  );

  /** 切换 mermaid 折叠状态并刷新页面 */
  const toggleMermaidCollapsed = () => {
    const next = !mermaidCollapsed;
    setMermaidCollapsed(next);
    localStorage.setItem('mermaidCollapsed', String(next));
    window.location.reload();
  };

  /** 切换 PC 端文章列表面板收起/展开 */
  const toggleListCollapse = () => {
    const next = !listCollapsed;
    setListCollapsed(next);
    localStorage.setItem('docListListCollapsed', String(next));
  };

  /** 打开移动端 Drawer 文章列表面板 */
  const openListMenu = () => { setDrawerVisible(true); setDrawerType('list'); };
  /** 打开移动端 Drawer 导航面板 */
  const openListNav = () => { setDrawerVisible(true); setDrawerType('nav'); };
  /** 切换移动端左侧菜单显示/隐藏 */
  const menuToLeft = () => { setMenuVisible(!menuVisible); localStorage.setItem('docListMenuVisible', String(!menuVisible)); };

  // 从 URL 参数解构
  const { name, handleType } = params;
  // 是否有多篇文章（决定是否显示列表面板）
  const showList = localStore.articleList?.length > 1;
  // 是否为分享模式（隐藏操作按钮和侧边栏）
  const isShareMode = handleType === 'share';
  // 是否为移动端
  const isMobile = !IsPC();
  // PC 端且非分享模式
  const isPCAndNotShare = !isMobile && !isShareMode && showList;
  // 是否显示文章列表收起/展开按钮
  const showCollapseToggle = isPCAndNotShare && showList;
  // 是否显示 PC 端操作按钮和导航
  const showPCControls = !isMobile;
  // 是否有 Markdown 和 HTML 内容
  const hasContent = !!localStore.markdownInfo && !!localStore.htmlInfo;
  // PC 端文章列表面板是否显示（用于 className 切换，始终渲染以实现动画）
  const pageListVisible = isPCAndNotShare && !listCollapsed;

  /** 移动端 Drawer 内容映射：根据 drawerType 渲染对应面板 */
  const drawerContentMap: Record<Exclude<DrawerType, ''>, () => React.ReactNode> = {
    list: () => (
      <PageList
        articleList={localStore.articleList}
        activeId={activeId}
        onPageClick={handleClickPage}
        styles={style}
      />
    ),
    nav: () => <PageNav originAnchor={localStore.anchor} anchor={anchor} htmlInfo={localStore.htmlInfo} onSearch={onSearch} styles={style} />
  };

  return useObserver(() => <div className={style.container}>
    {/* 顶部导航栏 */}
    <Header showLeft={!isShareMode} leftPath={`/${APP_NAME}/note`} name={localStore.techClassName ? `${localStore.techClassName}: ${localStore.title}` : localStore.title || name} handleContent={handleContent} />
    <div className={style.main}>
      {/* 移动端左侧菜单（className 切换实现滑入/滑出动画） */}
      {isMobile && <MobileMenu
        isShareMode={isShareMode}
        menuVisible={menuVisible}
        onToggleMenu={menuToLeft}
        onOpenListMenu={openListMenu}
        onOpenListNav={openListNav}
        onCopyContent={doCopy}
        onPrintPage={toPrintPage}
        hasAnchor={!!localStore.anchor?.length}
        hasMultipleArticles={localStore.articleList?.length > 1}
        styles={style}
      />}
      {/* PC 端文章列表收起/展开按钮（className 切换实现箭头方向动画） */}
      {showCollapseToggle && <CollapseToggle listCollapsed={listCollapsed} onToggle={toggleListCollapse} styles={style} />}
      {/* PC 端操作按钮栏 */}
      {showPCControls && <ActionButtons mermaidCollapsed={mermaidCollapsed} onToggleMermaid={toggleMermaidCollapsed} onCopyContent={doCopy} onPrintPage={toPrintPage} hasMermaid={localStore.markdownInfo?.includes('mermaid')} styles={style} />}
      {/* PC 端文章列表面板（始终渲染，通过 className 切换实现展开/收起动画） */}
      {isPCAndNotShare && (
        <div className={classnames(style.page_list, pageListVisible ? style.page_list_visible : style.page_list_collapsed, 'shadow_not_active')}>
          <PageList articleList={localStore.articleList} activeId={activeId} onPageClick={handleClickPage} styles={style} />
        </div>
      )}
      <div className={classnames(style.page_main, 'shadow_not_active', 'markdown_screen')}>
        <div className={classnames(style.markdown_main, 'markdown-main-content')}>
          {/* Markdown 内容区域 */}
          {hasContent ? <Markdown id={activeId} setAnchor={setAnchor} defaultCollapsed={mermaidCollapsed} isShareMode={isShareMode} /> : <Empty />}
        </div>
      </div>
      {/* PC 端锚点导航面板 */}
      {showPCControls && <PageNav anchor={anchor} htmlInfo={localStore.htmlInfo} onSearch={onSearch} styles={style} originAnchor={localStore.anchor} />}
    </div>
    {/* 右下角固定按钮 */}
    <Fixed propsVisible handleContent={handleContent} actions={null} />
    {/* 移动端 Drawer 抽屉 */}
    <Drawer open={drawerVisible} styles={{ wrapper: { padding: 0 } }} width='80%' closable={false} title={isMobile ? drawerTitleMap[drawerType] : null} placement='left' onClose={() => setDrawerVisible(false)}>
      <div className={classnames(style.main)}>
        <div className={style.page_list}>
          {isMobile && drawerType && drawerContentMap[drawerType]?.()}
        </div>
      </div>
    </Drawer>
  </div>);
}