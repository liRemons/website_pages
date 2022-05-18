import { useEffect } from 'react';
import { useObserver, useLocalObservable } from 'mobx-react';
import { openApp } from 'methods-r';
import store from '../model/store';
import Empty from '@components/Empty';
import Container from '@components/Container';
import CardList from '@components/CardList';
import Fixed from '@components/Fixed';
export default function HomeList() {
  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    localStore.queryTechClassList();
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
    main={
      localStore.techClassList?.length === 0
        ? <Empty />
        : <CardList list={localStore.techClassList || []} itemClick={openPage} />
    }
  />
    <Fixed />
  </>);
}
