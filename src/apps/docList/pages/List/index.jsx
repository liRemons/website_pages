import React, { useEffect, useRef, useState } from 'react';
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
import MarkMap from '@components/MarkMap';
import { Input, Drawer, message } from 'antd';
import { img } from '@utils';
import mindSvg from './assets/svg/mind.svg';
import fullscreenSvg from './assets/svg/fullscreen.svg';
import quitfullscreenSvg from './assets/svg/quitfullscreen.svg';
import txtSvg from './assets/svg/txt.svg';
import docListSvg from './assets/svg/docList.svg';
import htmlSvg from './assets/svg/html.svg';
import markdownSvg from './assets/svg/markdown.svg';
import anchorListSvg from './assets/svg/anchorList.svg'
import { LeftOutlined, RightOutlined, EllipsisOutlined, CloseOutlined } from '@ant-design/icons';
import { getSearchParams, debounce, IsPC } from 'methods-r';

export default function List() {
  const localStore = useLocalObservable(() => store);
  const [params, setParams] = useState({});
  const [activeId, setActiveId] = useState('');
  const [anchor, setAnchor] = useState([]);
  const [viewType, setViewType] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState('');
  const [menuVisible, setMenuVisible] = useState(localStorage.docListMenuVisible || false);
  const [actionButtonsVisible, setActionButtonsVisible] = useState(false);
  const actionButtonsRef = useRef(null);

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
    await localStore.queryArticleList({ techClassId });
    if (pageId) {
      localStore.getMarkdown(pageId);
      setActiveId(pageId);
      setViewType('html')
    } else {
      if (localStore.articleList?.length) {
        const info = localStore.articleList[0]
        localStore.getMarkdown(info.id);
        setActiveId(info.id);
        setViewType('html')
      }
    }
  };

  const handleClickPage = (data) => {
    const { id } = data;
    const params = {
      ...getSearchParams(),
      pageId: id,
    };
    const newParams = new URLSearchParams(params);
    const pageURL = newParams.toString() ? `/${APP_NAME}/docList?${newParams.toString()}` : `/${APP_NAME}/docList`;
    history.pushState('', '', pageURL);
    setActiveId(id);
    setViewType('html');
    setDrawerVisible(false);
    setActionButtonsVisible(false);
    localStore.getMarkdown(id);
  };


  const changeFullscreen = () => {
    const ele = document.querySelector('.markdown_screen');
    if (!fullscreen) {
      ele.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const changeViewType = () => {
    viewType === 'html' ? setViewType('markMap') : setViewType('html')
  }

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

  useEffect(() => {
    if (!actionButtonsVisible) {
      return undefined;
    }

    const handleClickOutsideActionButtons = (event) => {
      if (actionButtonsRef.current?.contains(event.target)) {
        return;
      }
      setActionButtonsVisible(false);
    };

    document.addEventListener('mousedown', handleClickOutsideActionButtons);
    document.addEventListener('touchstart', handleClickOutsideActionButtons);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideActionButtons);
      document.removeEventListener('touchstart', handleClickOutsideActionButtons);
    };
  }, [actionButtonsVisible]);

  const renderActionButtons = () => {
    const actions = [
      { key: 'copyHtml', title: '复制渲染后的带格式 HTML', label: 'HTML',icon: img(htmlSvg, 20), onClick: () => copyContent('html') },
      { key: 'copyMarkdown', title: '复制原始 Markdown', label: 'MD', icon: img(markdownSvg, 20), onClick: () => copyContent('markdown') },
      { key: 'fullscreen', title: fullscreen ? '退出全屏' : '全屏', icon: !fullscreen ? img(fullscreenSvg, 20) : img(quitfullscreenSvg, 20), onClick: changeFullscreen },
      { key: 'viewType', title: viewType === 'html' ? '切换思维导图' : '切换文本', icon: viewType === 'html' ? img(mindSvg, 20) : img(txtSvg, 20), onClick: changeViewType },
    ];

    const handleClickAction = (onClick) => {
      onClick();
      setActionButtonsVisible(false);
    }

    return <div ref={actionButtonsRef} className={classnames(style.actionButtons, actionButtonsVisible ? style.actionButtonsVisible : '')}>
      <span className={classnames(style.actionButton, style.actionToggle, 'circle')} title={actionButtonsVisible ? '收起操作' : '展开操作'} onClick={() => setActionButtonsVisible(!actionButtonsVisible)}>
        {actionButtonsVisible ? <CloseOutlined /> : <EllipsisOutlined />}
      </span>
      <div className={style.actionPanel}>
        {actions.map(item => <span className={classnames(style.actionButton, 'circle')} key={item.key} title={item.title} onClick={() => handleClickAction(item.onClick)}>
          {item.icon || item.label}
        </span>)}
      </div>
    </div>
  }

  const { name, handleType } = params;

  const VIEW_DETAIL = {
    html: <Markdown id={activeId} setAnchor={setAnchor} />,
    markMap: <MarkMap markdownInfo={localStore.markdownInfo} />
  }

  const renderList = () => {
    return <div className={classnames(style.page_list, 'shadow_not_active')}>
      <div className={style.page_list_main}>
        {
          localStore.articleList?.length ? localStore.articleList.map(item => <div key={item.id} onClick={() => handleClickPage(item)} className={classnames(style.page_list_title, activeId === item.id ? style.active : '')}> {item.title}</div>) : <Empty />
        }
      </div>
    </div>
  }

  const renderNav = () => {
    if (!anchor?.length) return
    
    return <>
      {viewType === 'html' && <div className={classnames(style.page_nav, 'shadow_not_active')}>
        <div className={style.search}>
          <Input placeholder="请输入以搜索" onChange={(e) => debounce(onSearch(e.target.value))} />
        </div>
        {viewType === 'html' && localStore.htmlInfo && <Anchor anchor={anchor} />}
      </div>}
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
      { onClick: openListMenu, icon: img(docListSvg, 24), isShow: localStore.articleList?.length !== 0 && handleType !== 'share' },
      { onClick: openListNav, icon: img(anchorListSvg, 24), isShow: viewType === 'html' && localStore.markdownInfo, isShow: !!anchor?.length },
      { onClick: menuToLeft, className: menuVisible ? style.toRightIcon : '', icon: menuVisible ? <RightOutlined /> : <LeftOutlined />, isShow: true }
    ];
    return arr.filter(item => item.isShow).map((item, index) => <span className={classnames(item.className, 'circle')} key={index} onClick={item.onClick}>{item.icon}</span>)
  }

  return useObserver(() => <div className={style.container}>
    <Header showRight={handleType !== 'share'} showLeft={handleType !== 'share'} leftPath={`/${APP_NAME}/note`} name={localStore.title || name} handleContent={handleContent} />
    <div className={style.main}>
      {!IsPC() && <div className={classnames(style.h5_menu, menuVisible ? style.menuLeft : style.menuLeftNone)}>
        {renderMenuList()}
      </div>}
      {IsPC() && handleType !== 'share' && renderList()}
      <div className={classnames(style.page_main, 'shadow_not_active', 'markdown_screen')}>
        <div className={style.markdown_main}>
          {renderActionButtons()}
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
