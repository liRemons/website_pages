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
import { Input, BackTop } from 'antd';
import { ArrowDownOutlined, ExpandOutlined, CompressOutlined, ApartmentOutlined, FontSizeOutlined, SearchOutlined } from '@ant-design/icons';
import { download, getSearchParams, debounce } from 'methods-r';
import { HOST } from '@utils';

export default function List() {
  const localStore = useLocalObservable(() => store);
  const [params, setParams] = useState({});
  const [activeId, setActiveId] = useState('');
  const [anchor, setAnchor] = useState([]);
  const [viewType, setViewType] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
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
  return useObserver(() => <div className={style.container}>
    <Header name={name} rightComponent={rightComponent()} />
    <div className={style.main}>
      <div className={classnames(style.page_list, 'shadow_not_active')}>
        <div className={style.page_list_main}>
          {
            localStore.articleList?.length ? localStore.articleList.map(item => <div key={item.id} onClick={() => handleClickPage(item)} className={classnames(style.page_list_title, activeId === item.id ? style.active : '')}> {item.title}</div>) : <Empty />
          }
        </div>
      </div>
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
      {viewType === 'html' && localStore.markdownInfo && <div className={classnames(style.page_nav, 'shadow_not_active')}>
        <div className={style.search}>
          <Input placeholder="请输入以搜索" onChange={(e) => debounce(onSearch(e.target.value))} />
        </div>
        {viewType === 'html' && <Anchor anchor={anchor} />}
      </div>}
    </div>
    {localStore.markdownInfo && <BackTop target={() => document.getElementsByClassName('markdown')?.[0]} />}
    <Fixed />
  </div >);
}
