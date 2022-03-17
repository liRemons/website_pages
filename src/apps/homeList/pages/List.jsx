import { useEffect } from 'react';
import classNames from 'classnames';
import { useObserver, useLocalObservable } from 'mobx-react';
import { List, Card } from 'antd';
import { HOST } from '@utils';
import { openApp } from 'methods-r';
import store from '../model/store';
import Empty from '@components/Empty';
import Fixed from '@components/Fixed';
import '@assets/css/index.global.less';
import style from './index.less';
export default function HomeList() {
  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    localStore.queryTechClassList();
  }, []);

  const openPage = (data) => {
    const { name, id } = data;
    openApp({
      url:`/${APP_NAME}/docList`,
      params: {
        name, id
      }
    });
  };

  return useObserver(() => <> <div className={style.container}>
    {localStore.techClassList?.length === 0 ? <Empty /> : <List
      grid={{ gutter: 24, column: 4 }}
      dataSource={localStore.techClassList || []}
      renderItem={item => (
        <List.Item onClick={() => openPage(item)} className={classNames('shadow', style.cardItem)}>
          <Card title={item.name}>
            <img src={`${HOST}${item.icon}`} alt="" />
          </Card>
        </List.Item>
      )}
    />}
  </div>
    <Fixed />
  </>);
}
