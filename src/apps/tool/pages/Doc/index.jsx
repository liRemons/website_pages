import React, { useEffect } from 'react';
import Header from '@components/Header';
import Container from '@components/Container';
import { useLocalObservable, useObserver } from 'mobx-react';
import style from '../index.module.less';
import store from '../../model/store';
import { Empty } from 'antd';
import { HOST } from '@utils';
export default function Doc() {
  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    localStore.getDocList();
  }, []);

  const openUrl = ({ url }) => {
    window.open(HOST + url);
  };
  return useObserver(() => <Container
    header={<Header name='文档' leftPath={`/${APP_NAME}/tool`} />}
    main={
      <div className={style.page_list}>
        <div className={style.page_list_main}>
          {
            localStore.docList?.length ? localStore.docList.map(item => <div key={item.id} onClick={() => openUrl(item)} className={style.page_list_title}> {item.title}</div>) : <Empty />
          }
        </div>
      </div>
    }
  />
  );
}
