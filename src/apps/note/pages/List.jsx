import React, { useEffect } from 'react';
import { useObserver, useLocalObservable } from 'mobx-react';
import { openApp } from 'methods-r';
import store from '../model/store';
import Empty from '@components/Empty';
import Container from '@components/Container';
import CardList from '@components/CardList';
import Fixed from '@components/Fixed';
import Header from '@components/Header';
import '@assets/css/index.global.less';
import handleContent from '../handle.md';
import { preload } from '@/utils/preload';
export default function HomeList() {
  preload(['mermaid']);
  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    localStore.queryTechClassList({ websiteRole: window.location.host });
  }, []);

  const openPage = (data) => {
    const { name, id } = data;
    openApp({
      url: `/${APP_NAME}/docList`,
      params: {
        name, id
      }
    });
  };

  return useObserver(() => <> <Container
    header={<Header name='学习笔记' handleContent={handleContent} />}
    main={
      localStore.techClassList?.length === 0
        ? <Empty />
        : <CardList list={localStore.techClassList || []} itemClick={openPage} />
    }
  />
    <Fixed />
  </>);
}
