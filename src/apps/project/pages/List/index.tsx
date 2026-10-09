import React, { useEffect, useState } from 'react';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import Empty from '@components/Empty';
import { Drawer } from 'antd';
import { DownCircleTwoTone, UpCircleTwoTone } from '@ant-design/icons';
import classnames from 'classnames';
import '@assets/css/index.global.less';
import 'remons-render-markdown/dist/index.css';
import 'remons-markdown-plugins/style.css';
import { getSearchParams, IsPC } from 'methods-r';
import { isApp, openApp } from '@utils/nav';
import { useLocalObservable, useObserver } from 'mobx-react-lite';
import store from '../../model/store';
import Markdown from '../Markdown';
import PageList from './components/PageList';
import CollapseToggle from './components/CollapseToggle';
import MobileMenu from './components/MobileMenu';
import style from './index.module.less';
import { HOST } from '@/utils';

export default function List() {
  // MobX 本地状态，绑定全局 store
  const localStore = useLocalObservable(() => store);
  // URL 查询参数
  const [params, setParams] = useState<Record<string, string>>({});
  // 当前选中的文档 ID
  const [activeDocId, setActiveDocId] = useState('');
  // 当前项目名称
  const [projectName, setProjectName] = useState('');
  // 移动端文档列表 Drawer 显示状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 移动端左侧菜单显示状态（localStorage 持久化）
  const [menuVisible, setMenuVisible] = useState(localStorage.projectMenuVisible === 'true' || false);
  // PC 端文档列表面板收起状态（localStorage 持久化）
  const [listCollapsed, setListCollapsed] = useState(localStorage.projectListCollapsed === 'true');
  // mermaid 图表折叠状态（与 docList 共用 key，默认收起）
  const [mermaidCollapsed, setMermaidCollapsed] = useState(localStorage.mermaidCollapsed !== 'false');

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
        if (target) {
          setActiveDocId(target);
          localStore.getProjectDoc(target);
        }
      } catch (e) {
        // 错误提示由 service 统一处理
      }
    })();
  }, [projectId]);

  // 文档加载后，动态更新 document.title 和 OGP meta 标签
  useEffect(() => {
    const title = localStore.title;
    if (!title) return;
    const fullTitle = projectName ? `${projectName}：${title}` : title;
    document.title = fullTitle;
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="description"]', fullTitle);
  }, [localStore.title, projectName]);

  // 点击项目
  const handleProjectClick = (item: { id: string }) => {
    if (item.id === projectId) return;
    setActiveDocId('');
    openApp({ url: '/project', params: { projectId: item.id } });
  };

  // 点击文档
  const handleClickDoc = (data: { id: string }) => {
    const { id } = data;
    if (id === activeDocId) return;
    setActiveDocId(id);
    setDrawerVisible(false);
    localStore.getProjectDoc(id);
    const newParams = new URLSearchParams({ ...getSearchParams(), docId: id });
    // App（file://）环境下 pushState 绝对路径会被解析为 file:///project?... 触发加载错误，直接跳过
    if (!isApp()) {
      const pageURL = newParams.toString() ? `/project?${newParams.toString()}` : '/project';
      history.pushState('', '', pageURL);
    } else {
      openApp({ url: '/project', params: { ...getSearchParams(), docId: id } });
    }
  };

  // 切换 mermaid 折叠状态并刷新页面（与 docList 行为一致）
  const toggleMermaidCollapsed = () => {
    const next = !mermaidCollapsed;
    setMermaidCollapsed(next);
    localStorage.setItem('mermaidCollapsed', String(next));
    window.location.reload();
  };

  // 切换 PC 端文档列表面板收起/展开
  const toggleListCollapse = () => {
    const next = !listCollapsed;
    setListCollapsed(next);
    localStorage.setItem('projectListCollapsed', String(next));
  };

  // 打开移动端文档列表 Drawer
  const openListMenu = () => { setDrawerVisible(true); };
  // 切换移动端左侧菜单显示/隐藏
  const menuToLeft = () => { setMenuVisible(!menuVisible); localStorage.setItem('projectMenuVisible', String(!menuVisible)); };

  // 派生值放在 useObserver 回调内计算，确保 MobX 追踪到 observable 读取，数据更新后触发重渲染
  return useObserver(() => {
    const hasContent = !!localStore.markdownInfo && !!localStore.htmlInfo;
    // 是否有多篇文档（决定是否显示列表面板）
    const showDocList = localStore.docList?.length > 1;
    // PC 端是否显示文档列表面板
    const showPcList = !isMobile && showDocList;
    // PC 端文档列表面板是否展开（className 切换实现显示/隐藏动画）
    const pageListVisible = showPcList && !listCollapsed;
    // 文档内容是否包含 mermaid（决定是否显示 mermaid 折叠按钮）
    const hasMermaid = localStore.markdownInfo?.includes('mermaid');
    const headerName = projectId
      ? (localStore.title
        ? (projectName ? `${projectName}：${localStore.title}` : localStore.title)
        : (projectName || '项目管理'))
      : '项目管理';

    return <div className={style.container}>
    <Header showLeft name={headerName} leftPath={projectId ? '/project' : '/homeList'} />

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
              menuVisible={menuVisible}
              onToggleMenu={menuToLeft}
              onOpenListMenu={openListMenu}
              hasMultipleDocs={showDocList}
              styles={style}
            />
          )}

          {/* PC 端 mermaid 折叠按钮（仅当内容包含 mermaid 时显示） */}
          {!isMobile && hasMermaid && (
            <span
              className={classnames(style.actionButtons, 'circle')}
              title={mermaidCollapsed ? '一键展开 mermaid' : '一键收起 mermaid'}
              onClick={toggleMermaidCollapsed}
            >
              {mermaidCollapsed ? <DownCircleTwoTone /> : <UpCircleTwoTone />}
            </span>
          )}

          {/* PC 端文档列表面板（始终渲染，className 切换收起/展开动画） */}
          {showPcList && (
            <div className={classnames(style.page_list, pageListVisible ? style.page_list_visible : style.page_list_collapsed, 'shadow_not_active')}>
              <PageList docList={localStore.docList} activeDocId={activeDocId} onDocClick={handleClickDoc} styles={style} />
            </div>
          )}
          <div className={classnames(style.page_main, 'shadow_not_active', 'markdown_screen')}>
            <div className={classnames(style.markdown_main, 'markdown-main-content')}>
              {hasContent ? <Markdown defaultCollapsed={mermaidCollapsed} /> : <Empty />}
            </div>
          </div>
        </div>

        <Drawer
          open={drawerVisible}
          styles={{ wrapper: { padding: 0 } }}
          width='80%'
          closable={false}
          placement='left'
          title='项目文档'
          onClose={() => setDrawerVisible(false)}
        >
          <div className={style.main}>
            <div className={style.page_list}>
              <PageList docList={localStore.docList} activeDocId={activeDocId} onDocClick={handleClickDoc} styles={style} />
            </div>
          </div>
        </Drawer>
      </>
    )}
    <Fixed />
  </div>;
  });
}