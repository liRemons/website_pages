import { useEffect, useState } from 'react';
import { useObserver, useLocalObservable } from 'mobx-react';
import Empty from '@components/Empty';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import store from '../../model/store';
import classnames from 'classnames';
import '@assets/css/index.global.less';
import style from './index.less';
import Markdown from '../Markdown';
import Anchor from '../Anchor';
import MarkMap from '../MarkMap';
import { Input, BackTop, Drawer } from 'antd';
import { ArrowDownOutlined, ExpandOutlined, CompressOutlined, ProfileOutlined, OrderedListOutlined, ApartmentOutlined, FontSizeOutlined, SearchOutlined } from '@ant-design/icons';
import { download, getSearchParams, debounce, IsPC } from 'methods-r';
import { HOST } from '@utils';

export default function List() {
  const localStore = useLocalObservable(() => store);
  const [params, setParams] = useState({});
  const [activeId, setActiveId] = useState('');
  const [anchor, setAnchor] = useState([]);
  const [viewType, setViewType] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState('');
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
    const { id: techClassId, pageId, pageUrl } = params;
    await localStore.queryArticleList({ techClassId });
    if (pageId, pageUrl) {
      localStore.getMarkdown(pageUrl);
      setActiveId(pageId);
      setViewType('html')
    } else {
      if (localStore.articleList?.length) {
        const info = localStore.articleList[0]
        localStore.getMarkdown(info.url);
        setActiveId(info.id);
        setViewType('html')
      }
    }
  };

  const handleClickPage = (data) => {
    const { id, url } = data;
    const params = {
      ...getSearchParams(),
      pageId: id,
      pageUrl: url
    };
    const newParams = new URLSearchParams(params);
    const pageURL = newParams.toString() ? `/${APP_NAME}/docList?${newParams.toString()}` : `/${APP_NAME}/docList`;
    history.pushState('', '', pageURL);
    setActiveId(id);
    setViewType('html')
    localStore.getMarkdown(data.url);
  };


  const rightComponent = () => {
    const { markdownUrl: url } = localStore;
    return <>
      {url && <div className='circle' onClick={() => download(`${HOST}${url}`)}><ArrowDownOutlined /></div>}
    </>;
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


  const { id, name } = params;

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
    return <>{viewType === 'html' && localStore.markdownInfo && <div className={classnames(style.page_nav, 'shadow_not_active')}>
      <div className={style.search}>
        <Input placeholder="请输入以搜索" onChange={(e) => debounce(onSearch(e.target.value))} />
      </div>
      {viewType === 'html' && <Anchor anchor={anchor} />}
    </div>
    }
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

  return useObserver(() => <div className={style.container}>
    <Header leftPath={`/${APP_NAME}/note`} name={name} rightComponent={rightComponent()} />
    <div className={style.main}>
      {!IsPC() && <div className={style.h5_menu}>
        {localStore.articleList?.length && <span className='circle' onClick={openListMenu}><ProfileOutlined /></span>}
        {(viewType === 'html' && localStore.markdownInfo) && <span className='circle' onClick={openListNav}><OrderedListOutlined /></span>}
      </div>}
      {IsPC() && renderList()}
      <div className={classnames(viewType === 'html' ? style.page_main : style.page_max_main, 'shadow_not_active', 'markdown_screen')}>
        <div className={style.markdown_main}>
          <span className={classnames(style.fullscreen, 'circle')} onClick={changeFullscreen} >
            {!fullscreen ? <ExpandOutlined /> : <CompressOutlined />}
          </span>
          <span className={classnames(style.viewType, 'circle')} onClick={changeViewType} >
            {viewType === 'html' ? <ApartmentOutlined /> : <FontSizeOutlined />}
          </span>
          {
            localStore.markdownInfo ? VIEW_DETAIL[viewType] : <Empty />
          }
        </div>
      </div>
      {IsPC() && renderNav()}
    </div>
    {localStore.markdownInfo && viewType === 'html' && <BackTop target={() => document.getElementsByClassName('markdown')?.[0]} />}
    <Fixed />

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
