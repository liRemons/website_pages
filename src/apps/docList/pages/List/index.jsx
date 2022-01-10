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
import { ArrowDownOutlined } from '@ant-design/icons';
import { download, getSearchParams } from 'methods-r';
import { HOST } from '@utils';

export default function List() {
  const localStore = useLocalObservable(() => store);
  const [params, setParams] = useState({});
  const [activeId, setActiveId] = useState('');
  const [detail, setDetail] = useState({});
  const [anchor, setAnchor] = useState([]);
  useEffect(() => {
    getList();
  }, []);


  const getList = async () => {
    const params = getSearchParams();
    setParams(params);
    const { id: techClassId } = params;
    await localStore.queryArticleList({ techClassId });
  };

  const handleClickPage = (data) => {
    const { id } = data;
    setActiveId(id);
    setDetail(data);
  };

  const getAuchor = (arr) => {
    const anchorArr = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((item, index) => {
      const text = item.innerText.replace(/\s+/g, '') + '-No-' + index;
      item.className = 'anchor_markdown';
      item.id = text;
      anchorArr.push({
        title: item.outerHTML,
        text
      });
    });
    setAnchor(arr || anchorArr);
  };

  const rightComponent = () => {
    const { markdownUrl: url } = localStore;
    return <>
      {url && <div className='circle' onClick={() => download(`${HOST}${url}`)}><ArrowDownOutlined /></div>}
    </>;
  };


  const { id, name } = params;
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
      <div className={classnames(style.page_main, 'shadow_not_active')}>
        <Markdown getAuchor={getAuchor} id={activeId} detail={detail} />
      </div>
      <div className={classnames(style.page_nav, 'shadow_not_active')}>
        <Anchor anchor={anchor} />
      </div>
    </div>
    <Fixed />
  </div >);
}
