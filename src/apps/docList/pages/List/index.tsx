/**
 * List 文档列表页面
 * 功能：展示文章列表、Markdown 渲染、锚点导航、复制/打印、mermaid 折叠等
 * 支持 PC 端三栏布局和移动端 Drawer 抽屉模式
 */
import React, { useEffect, useState } from 'react';
import { useObserver, useLocalObservable } from 'mobx-react-lite';
import Empty from '@components/Empty';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import store from '../../model/store';
import '@assets/css/index.global.less';
import style from './index.module.less';
import Markdown from '../Markdown';
import { getSearchParams, IsPC } from 'methods-r';
import { isApp, openApp } from '@utils/nav';
import { verifyLogin } from '@utils/auth';
import copyContent from '@/hooks/copyContent';
import usePersistedToggle from '@/hooks/usePersistedToggle';
import useMermaidCollapsed from '@/hooks/useMermaidCollapsed';
import useDocTitle from '@/hooks/useDocTitle';
import useItemSwitcher from '@/hooks/useItemSwitcher';
import printPage from './hooks/printPage';
import ActionButtons from '@components/MarkdownActions/ActionButtons';
import MobileMenu from '@components/MarkdownActions/MobileMenu';
import CollapseToggle from '@components/MarkdownActions/CollapseToggle';
import DocListPanel from '@components/MarkdownActions/DocListPanel';
import DocContent from '@components/MarkdownActions/DocContent';
import MobileListDrawer from '@components/MarkdownActions/MobileListDrawer';
import computeDocView from '@components/MarkdownActions/view';
import { DrawerType } from './types';

/** 抽屉面板标题映射 */
const drawerTitleMap: Record<DrawerType, string> = {
  list: '文章列表',
  '': '',
};

export default function List() {
  // MobX 本地状态，绑定全局 store
  const localStore = useLocalObservable(() => store);
  // URL 查询参数
  const [params, setParams] = useState<Record<string, string>>({});
  // 移动端 Drawer 面板类型：'list' 文章列表
  const [drawerType, setDrawerType] = useState<DrawerType>('');
  // 移动端左侧菜单显示状态（localStorage 持久化）
  const [menuVisible, toggleMenuVisible] = usePersistedToggle('docListMenuVisible');
  // PC 端文章列表面板收起状态（localStorage 持久化）
  const [listCollapsed, toggleListCollapse] = usePersistedToggle('docListListCollapsed');
  // mermaid 图表折叠状态（localStorage 持久化，默认收起，切换后刷新）
  const [mermaidCollapsed, toggleMermaidCollapsed] = useMermaidCollapsed();

  // 当前选中文章 / 移动端抽屉 / 点击切换（含 URL 同步）
  const { activeId, drawerVisible, setDrawerVisible, select, handleClick: handleClickPage } = useItemSwitcher({
    path: '/docList',
    idParam: 'pageId',
    load: (id) => localStore.getMarkdown(id),
  });

  // 复制和打印工具函数
  const { copyContent: doCopy } = copyContent(localStore);
  const { toPrintPage } = printPage(localStore);

  // 动态更新 document.title 和 OGP meta 标签，同时供 Header 展示
  const fullTitle = useDocTitle([localStore.techClassName, localStore.title], { separator: ': ' });

  // 组件挂载时加载文章列表
  useEffect(() => {
    getList();
  }, []);

  // App 环境下校验登录态：以服务端返回为准（token 可能已过期），失败才去登录页
  useEffect(() => {
    if (isApp()) {
      verifyLogin().then((ok: boolean) => {
        if (!ok) {
          openApp({ url: '/login' });
        }
      });
    }
  }, []);

  /** 获取文章列表并初始化当前文章 */
  const getList = async () => {
    const params = getSearchParams();
    setParams(params);
    const { id: techClassId, pageId, handleType } = params;
    await localStore.queryArticleList({ techClassId, websiteRole: window.location.host, isShareMode: handleType === 'share' });
    if (pageId) {
      // URL 指定了文章 ID，直接加载
      select(pageId);
    } else if (localStore.articleList?.length) {
      // 未指定 ID，默认加载第一篇文章
      select(localStore.articleList[0].id);
    }
  };

  /** 打开移动端 Drawer 文章列表面板 */
  const openListMenu = () => { setDrawerVisible(true); setDrawerType('list'); };

  // 从 URL 参数解构
  const { handleType } = params;
  // 是否为分享模式（隐藏操作按钮和侧边栏）
  const isShareMode = handleType === 'share';
  // 是否为移动端
  const isMobile = !IsPC();

  return useObserver(() => {
    // 派生标志在 useObserver 回调内计算，确保 MobX 追踪到 observable 读取
    const { hasContent, hasMermaid, showList, showPcList, pageListVisible } = computeDocView({
      isMobile,
      hasMarkdown: !!localStore.markdownInfo,
      hasHtml: !!localStore.htmlInfo,
      listCount: localStore.articleList?.length,
      markdownInfo: localStore.markdownInfo,
      listCollapsed,
      isShareMode,
    });

    return <div className={style.container}>
      {/* 顶部导航栏 */}
      <Header showLeft={!isShareMode || isApp()} showRight={false} leftPath='/note' name={fullTitle} />
      {/* PC 端文章列表收起/展开按钮（className 切换实现箭头方向动画） */}
      {showPcList && <CollapseToggle listCollapsed={listCollapsed} onToggle={toggleListCollapse} styles={style} />}
      <div className={style.main}>
        {/* 移动端左侧菜单（className 切换实现滑入/滑出动画） */}
        {isMobile && <MobileMenu
          prefix='docList-menu'
          isShareMode={isShareMode}
          menuVisible={menuVisible}
          onToggleMenu={toggleMenuVisible}
          onOpenListMenu={openListMenu}
          onCopyContent={doCopy}
          onPrintPage={toPrintPage}
          hasList={showList}
          styles={style}
        />}

        {/* PC 端操作按钮栏 */}
        {!isMobile && <ActionButtons prefix='docList-menu' mermaidCollapsed={mermaidCollapsed} onToggleMermaid={toggleMermaidCollapsed} onCopyContent={doCopy} onPrintPage={toPrintPage} hasMermaid={hasMermaid} styles={style} />}
        {/* PC 端文章列表面板（始终渲染，通过 className 切换实现展开/收起动画） */}
        {showPcList && <DocListPanel visible={pageListVisible} items={localStore.articleList} activeId={activeId} onItemClick={handleClickPage} styles={style} />}
        <DocContent hasContent={hasContent} styles={style}>
          {(ok) => ok ? <Markdown id={activeId} defaultCollapsed={mermaidCollapsed} isShareMode={isShareMode} /> : <Empty />}
        </DocContent>
      </div>
      {/* 右下角固定按钮 */}
      <Fixed propsVisible actions={null} />
      {/* 移动端 Drawer 抽屉（始终挂载，open 控制滑入/滑出动画） */}
      <MobileListDrawer open={drawerVisible} title={drawerType ? drawerTitleMap[drawerType] : ''} onClose={() => setDrawerVisible(false)} items={localStore.articleList} activeId={activeId} onItemClick={handleClickPage} styles={style} />
    </div>;
  });
}