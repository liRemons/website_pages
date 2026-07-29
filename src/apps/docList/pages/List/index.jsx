import React, { useEffect, useState } from 'react';
import { useObserver, useLocalObservable } from 'mobx-react';
import Empty from '@components/Empty';
import Header from '@components/Header';
import handleContent from '../../handle.md';
import Fixed from '@components/Fixed';
import store from '../../model/store';
import classnames from 'classnames';
import '@assets/css/index.global.less';
import style from './index.module.less';
import Markdown from '../Markdown';
import Anchor from '../Anchor';
import { Input, Drawer, message } from 'antd';
import { LeftOutlined, RightOutlined, FileMarkdownTwoTone, Html5TwoTone, FolderOpenTwoTone, ProfileTwoTone } from '@ant-design/icons';
import { getSearchParams, debounce, IsPC } from 'methods-r';

export default function List() {
  const localStore = useLocalObservable(() => store);

  const [params, setParams] = useState({});
  const [activeId, setActiveId] = useState('');
  const [anchor, setAnchor] = useState([]);
  const viewType = 'html';
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState('');
  const [menuVisible, setMenuVisible] = useState(localStorage.docListMenuVisible === 'true' || false);

  useEffect(() => {
    getList();
  }, []);

  const onSearch = (searchTitle) => {
    if (!searchTitle) {
      setAnchor(JSON.parse(JSON.stringify(localStore.anchor)))
    } else {
      const deepAnchor = (data) => {
        return data.filter(item => {
          if (item.title.toLocaleLowerCase().includes(searchTitle.toLocaleLowerCase())) {
            return true
          }
          item.children = deepAnchor(item.children)
          return item.children.length
        })
      }
      setAnchor(deepAnchor(JSON.parse(JSON.stringify(localStore.anchor))))
    }
  }


  const getList = async () => {
    const params = getSearchParams();
    setParams(params);
    const { id: techClassId, pageId } = params;
    await localStore.queryArticleList({ techClassId, websiteRole: window.location.host });
    if (pageId) {
      localStore.getMarkdown(pageId);
      setActiveId(pageId);
    } else {
      if (localStore.articleList?.length) {
        const info = localStore.articleList[0]
        localStore.getMarkdown(info.id);
        setActiveId(info.id);
      }
    }
  };

  const handleClickPage = (data) => {
    const { id } = data;
    if (id === activeId) {
      return;
    }
    const params = {
      ...getSearchParams(),
      pageId: id,
    };
    const newParams = new URLSearchParams(params);
    const pageURL = newParams.toString() ? `/${APP_NAME}/docList?${newParams.toString()}` : `/${APP_NAME}/docList`;
    history.pushState('', '', pageURL);
    setActiveId(id);
    setDrawerVisible(false);
    localStore.getMarkdown(id);
  };

  const copyTextByCommand = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  const copyHtmlByCommand = (html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.contentEditable = 'true';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    document.body.removeChild(container);
  }

  const removeHiddenNodes = (sourceNode, cloneNode) => {
    const cloneChildren = Array.from(cloneNode.children);
    Array.from(sourceNode.children).forEach((sourceChild, index) => {
      const cloneChild = cloneChildren[index];
      if (!cloneChild) {
        return;
      }

      const computedStyle = window.getComputedStyle(sourceChild);
      const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
      if (isHidden) {
        cloneChild.remove();
        return;
      }

      removeHiddenNodes(sourceChild, cloneChild);
    });
  }

  const getVisibleHtml = () => {
    const markdownDom = document.querySelector('.markdown-html > div');
    if (!markdownDom) {
      return localStore.htmlInfo;
    }

    const cloneDom = markdownDom.cloneNode(true);
    removeHiddenNodes(markdownDom, cloneDom);
    cloneDom.querySelectorAll('.copy, .code-toggle').forEach(item => item.remove());
    return cloneDom.innerHTML;
  }

  const getPlainTextFromHtml = (html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.innerText;
  }

  const copyContent = async (type) => {
    const isHtml = type === 'html';
    const content = isHtml ? getVisibleHtml() : localStore.markdownInfo;
    if (!content) {
      message.warning('暂无可复制内容');
      return;
    }

    try {
      if (isHtml && navigator.clipboard?.write && window.ClipboardItem) {
        const clipboardItem = new window.ClipboardItem({
          'text/html': new Blob([content], { type: 'text/html' }),
          'text/plain': new Blob([getPlainTextFromHtml(content)], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else if (isHtml) {
        copyHtmlByCommand(content);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        copyTextByCommand(content);
      }
      message.success(isHtml ? '已复制带格式 HTML' : '已复制 Markdown');
    } catch (error) {
      isHtml ? copyHtmlByCommand(content) : copyTextByCommand(content);
      message.success(isHtml ? '已复制带格式 HTML' : '已复制 Markdown');
    }
  }

  const renderActionButtons = () => {
    const actions = [
      { key: 'docList-menu-copyHtml', title: '复制渲染后的带格式 HTML', label: 'HTML', icon: <Html5TwoTone />, onClick: () => copyContent('html') },
      { key: 'docList-menu-copyMarkdown', title: '复制原始 Markdown', label: 'MD', icon: <FileMarkdownTwoTone />, onClick: () => copyContent('markdown') },
    ];

    const handleClickAction = (onClick) => {
      onClick();
    }

    return <div className={classnames(style.actionButtons)}>
      <div className={style.actionPanel}>
        {actions.map(item => <span className={classnames(style.actionButton, item.key, 'circle')} key={item.key} title={item.title} onClick={() => handleClickAction(item.onClick)}>
          {item.icon}
        </span>)}
      </div>
    </div>
  }

  const { name, handleType } = params;

  const VIEW_DETAIL = {
    html: <Markdown id={activeId} setAnchor={setAnchor} />,
  }

  const renderList = () => {
    if (localStore.articleList?.length <= 1) {
      return null;
    }
    return <div className={classnames(style.page_list, 'shadow_not_active')}>
      <div className={style.page_list_main}>
        {
          localStore.articleList?.length ? localStore.articleList.map(item => <div key={item.id} onClick={() => handleClickPage(item)} className={classnames(style.page_list_title, activeId === item.id ? style.active : '')}> {item.title}</div>) : <Empty />
        }
      </div>
    </div>
  }

  const renderNav = () => {
    if (!localStore?.anchor?.length) return

    return <>
      <div className={classnames(style.page_nav, 'shadow_not_active')}>
        <div className={style.search}>
          <Input placeholder="请输入以搜索" onChange={(e) => debounce(onSearch(e.target.value))} />
        </div>
        {localStore.htmlInfo && <Anchor anchor={anchor} />}
      </div>
    </>
  }

  const openListMenu = () => {
    setDrawerVisible(true)
    setDrawerType('list')
  }

  const openListNav = () => {
    setDrawerVisible(true)
    setDrawerType('nav')
  }

  const drawerConent = () => {
    const obj = {
      list: renderList,
      nav: renderNav
    }
    if (!IsPC()) {
      return obj[drawerType] && obj[drawerType]()
    }
    return null
  }

  const drawerConentTitle = () => {
    const obj = {
      list: '文章列表',
      nav: '导航'
    }
    if (!IsPC()) {
      return obj[drawerType]
    }
    return null
  }

  const menuToLeft = () => {
    setMenuVisible(() => !menuVisible)
    localStorage.setItem('docListMenuVisible', !menuVisible)
  }

  const renderMenuList = () => {
    const arr = [
      { onClick: openListNav, icon: <ProfileTwoTone />, isShow: !!localStore.anchor?.length, className: 'docList-menu-anchor' },
      { onClick: openListMenu, icon: <FolderOpenTwoTone />, isShow: localStore.articleList?.length !== 0 && handleType !== 'share', className: 'docList-menu-list', isShow: localStore.articleList?.length > 1 },
      { className: 'docList-menu-copyHtml', title: '复制渲染后的带格式 HTML', icon: <Html5TwoTone />, onClick: () => copyContent('html') },
      { className: 'docList-menu-copyMarkdown', title: '复制原始 Markdown', icon: <FileMarkdownTwoTone />, onClick: () => copyContent('markdown') },
      { onClick: menuToLeft, className: menuVisible ? style.toRightIcon : '', icon: menuVisible ? <RightOutlined /> : <LeftOutlined />, isShow: true }
    ];
    return arr.filter(item => item.isShow !== false).map((item, index) => <span className={classnames(item.className, 'circle')} key={index} onClick={item.onClick}>{item.icon}</span>)
  }

  return useObserver(() => <div className={style.container}>
    <Header showRight={handleType !== 'share'} showLeft={handleType !== 'share'} leftPath={`/${APP_NAME}/note`} name={localStore.techClassName ? `${localStore.techClassName} (${localStore.title})`: localStore.title || name} handleContent={handleContent} />
    <div className={style.main}>
      {!IsPC() && <div className={classnames(style.h5_menu, menuVisible ? style.menuLeft : style.menuLeftNone)}>
        {renderMenuList()}
      </div>}
      {IsPC() && handleType !== 'share' && renderList()}
      <div className={classnames(style.page_main, 'shadow_not_active', 'markdown_screen')}>
        <div className={classnames(style.markdown_main, 'markdown-main-content')}>
          {IsPC() && renderActionButtons()}
          {
            (localStore.markdownInfo && localStore.htmlInfo) ? VIEW_DETAIL[viewType] : <Empty />
          }
        </div>
      </div>
      {IsPC() && renderNav()}
    </div>
    <Fixed propsVisible />

    <Drawer
      contentWrapperStyle={{ padding: 0 }}
      width='80%'
      closable={false}
      title={drawerConentTitle()}
      placement='left'
      onClose={() => setDrawerVisible(false)}
      visible={drawerVisible}
    >
      <div className={style.main}>
        {
          drawerConent()
        }
      </div>
    </Drawer>
  </div >);
}
