import React, { useEffect, useState } from 'react';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import Empty from '@components/Empty';
import classnames from 'classnames';
import '@assets/css/index.global.less';
import 'remons-render-markdown/dist/index.css';
import 'remons-markdown-plugins/style.css';
import { getSearchParams, IsPC } from 'methods-r';
import { openApp } from '@utils/nav';
import { useLocalObservable, useObserver } from 'mobx-react-lite';
import store from '../../model/store';
import Markdown from '../Markdown';
import copyContent from '@/hooks/copyContent';
import usePersistedToggle from '@/hooks/usePersistedToggle';
import useMermaidCollapsed from '@/hooks/useMermaidCollapsed';
import useDocTitle from '@/hooks/useDocTitle';
import useItemSwitcher from '@/hooks/useItemSwitcher';
import ActionButtons from '@components/MarkdownActions/ActionButtons';
import MobileMenu from '@components/MarkdownActions/MobileMenu';
import CollapseToggle from '@components/MarkdownActions/CollapseToggle';
import DocListPanel from '@components/MarkdownActions/DocListPanel';
import DocContent from '@components/MarkdownActions/DocContent';
import MobileListDrawer from '@components/MarkdownActions/MobileListDrawer';
import computeDocView from '@components/MarkdownActions/view';
import style from './index.module.less';
import { HOST } from '@/utils';

export default function List() {
  // MobX 本地状态，绑定全局 store
  const localStore = useLocalObservable(() => store);
  // URL 查询参数
  const [params, setParams] = useState<Record<string, string>>({});
  // 当前项目名称
  const [projectName, setProjectName] = useState('');
  // 移动端左侧菜单显示状态（localStorage 持久化）
  const [menuVisible, toggleMenuVisible] = usePersistedToggle('projectMenuVisible');
  // PC 端文档列表面板收起状态（localStorage 持久化）
  const [listCollapsed, toggleListCollapse] = usePersistedToggle('projectListCollapsed');
  // mermaid 图表折叠状态（与 docList 共用 key，默认收起，切换后刷新）
  const [mermaidCollapsed, toggleMermaidCollapsed] = useMermaidCollapsed();

  // 当前选中文档 / 移动端抽屉 / 点击切换（含 URL 同步）
  const { activeId: activeDocId, setActiveId: setActiveDocId, drawerVisible, setDrawerVisible, select, handleClick: handleClickDoc } = useItemSwitcher({
    path: '/project',
    idParam: 'docId',
    load: (id) => localStore.getProjectDoc(id),
  });

  // 复制工具函数（复制 HTML / Markdown）
  const { copyContent: doCopy } = copyContent(localStore);

  // 动态更新 document.title 和 OGP meta 标签，同时供 Header 展示
  const docTitle = useDocTitle([projectName, localStore.title]);

  const { projectId, docId } = params;
  const isMobile = !IsPC();

  // 获取 URL 参数
  useEffect(() => {
    const p = getSearchParams() || {};
    setParams(p);
  }, []);

  // 无 projectId 时加载并展示项目列表
  useEffect(() => {
    if (projectId) return;
    localStore.queryProjectList().catch(() => {
      // 错误提示由 service 统一处理
    });
  }, [projectId]);

  // 带 projectId 时加载项目文档
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        await localStore.queryProjectList();
        const project = localStore.projectList.find((item) => item.id === projectId);
        setProjectName(project?.name || '');
        await localStore.queryProjectDocList(projectId);
        // URL 指定了文档 ID 则直接加载，否则默认加载第一篇
        const target = docId || localStore.docList?.[0]?.id || '';
        if (target) select(target);
      } catch (e) {
        // 错误提示由 service 统一处理
      }
    })();
  }, [projectId]);

  // 点击项目
  const handleProjectClick = (item: { id: string }) => {
    if (item.id === projectId) return;
    setActiveDocId('');
    openApp({ url: '/project', params: { projectId: item.id } });
  };

  // 打开移动端文档列表 Drawer
  const openListMenu = () => { setDrawerVisible(true); };

  // 派生值放在 useObserver 回调内计算，确保 MobX 追踪到 observable 读取，数据更新后触发重渲染
  return useObserver(() => {
    const { hasContent, hasMermaid, showList: showDocList, showPcList, pageListVisible } = computeDocView({
      isMobile,
      hasMarkdown: !!localStore.markdownInfo,
      hasHtml: !!localStore.htmlInfo,
      listCount: localStore.docList?.length,
      markdownInfo: localStore.markdownInfo,
      listCollapsed,
    });
    const headerName = projectId ? (docTitle || projectName || '项目管理') : '项目管理';

    return <div className={style.container}>
    <Header showRight={false} showLeft name={headerName} leftPath={projectId ? '/project' : '/homeList'} />

    {!projectId ? (
      // 项目列表视图
      <div className={classnames(style.main, style.project_main)}>
        {localStore.projectList.length ? (
          <div className={style.project_grid}>
            {localStore.projectList.map((item) => (
              <div className={style.project_card} key={item.id} onClick={() => handleProjectClick(item)}>
                {item.img && <img className={style.project_img} src={`${HOST}${item.img}`} alt={item.name} />}
                <div className={style.project_body}>
                  <div className={style.project_name}>{item.name}</div>
                  {item.description ? <div className={style.project_desc}>{item.description}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : <Empty />}
      </div>
    ) : (
      // 项目文档视图：左侧文档列表 + 右侧 Markdown
      <>
        {showPcList && <CollapseToggle listCollapsed={listCollapsed} onToggle={toggleListCollapse} styles={style} />}
        <div className={style.main}>
          {/* 移动端左侧菜单：文档列表、菜单收起/展开 */}
          {isMobile && (
            <MobileMenu
              prefix='project-menu'
              menuVisible={menuVisible}
              onToggleMenu={toggleMenuVisible}
              onOpenListMenu={openListMenu}
              onCopyContent={doCopy}
              hasList={showDocList}
              styles={style}
            />
          )}

          {/* PC 端操作按钮栏：mermaid 折叠、复制 HTML、复制 Markdown */}
          {!isMobile && <ActionButtons prefix='project-menu' mermaidCollapsed={mermaidCollapsed} onToggleMermaid={toggleMermaidCollapsed} onCopyContent={doCopy} hasMermaid={hasMermaid} styles={style} />}

          {/* PC 端文档列表面板（始终渲染，className 切换收起/展开动画） */}
          {showPcList && <DocListPanel visible={pageListVisible} items={localStore.docList} activeId={activeDocId} onItemClick={handleClickDoc} styles={style} />}
          <DocContent hasContent={hasContent} styles={style}>
            {(ok) => ok ? <Markdown defaultCollapsed={mermaidCollapsed} /> : <Empty />}
          </DocContent>
        </div>

        {/* 移动端 Drawer 抽屉（始终挂载，open 控制滑入/滑出动画） */}
        <MobileListDrawer open={drawerVisible} title='项目文档' onClose={() => setDrawerVisible(false)} items={localStore.docList} activeId={activeDocId} onItemClick={handleClickDoc} styles={style} />
      </>
    )}
    <Fixed propsVisible />
  </div>;
  });
}