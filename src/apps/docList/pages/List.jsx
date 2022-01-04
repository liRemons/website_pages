import { useEffect, useState } from 'react';
import { getSearchParams } from '@utils';
import { useObserver, useLocalObservable } from 'mobx-react';
import Empty from '@components/Empty';
import store from '../model/store';
import classnames from 'classnames';
import '@assets/css/index.global.less'
import style from './index.less';

export default function List() {
  const localStore = useLocalObservable(() => store);
  const [params, setParams] = useState({});
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    getList();
  }, [])


  const getList = async () => {
    const params = getSearchParams();
    setParams(params);
    const { id: techClassId } = params;
    await localStore.queryArticleList({ techClassId });
  }

  const { id, name } = params;
  return useObserver(() => <div className={style.container}>
    <div className={style.header}> {name}</div>
    <div className={style.main}>
      <div className={classnames(style.page_list, 'shadow_not_active')}>
        {
          localStore.articleList?.length ? localStore.articleList.map(item => <div className={classnames(style.page_list_title)}> {item.title}</div>) : <Empty />
        }
      </div>
      <div className={classnames(style.page_main, 'shadow_not_active')}></div>
      <div className={classnames(style.page_nav, 'shadow_not_active')}></div>
    </div>
  </div>)
}