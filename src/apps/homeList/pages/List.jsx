import { useEffect } from 'react';
import classNames from 'classnames';
import { useObserver, useLocalObservable } from 'mobx-react';
import { List, Card } from 'antd';
import { openApp } from '@utils';
import { HOST } from '../model/const';
import store from '../model/store';
import '@assets/css/index.global.less'
import style from './index.less';
export default function HomeList() {

  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    localStore.queryTechClassList();
  }, []);

  const openPage = (data) => {
    const { name, id } = data;
    openApp({
      url: '//remons.cn:8003/docList',
      params: {
        name, id
      }
    })
  }

  return useObserver(() => <> <div className={style.container}><List
    grid={{ gutter: 24, column: 4 }}
    dataSource={localStore.techClassList || []}
    renderItem={item => (
      <List.Item onClick={() => openPage(item)} className={classNames('shadow', style.cardItem)}>
        <Card title={item.name}>
          <img src={`${HOST}${item.icon}`} alt="" />
        </Card>
      </List.Item>
    )}
  />
  </div>
  </>
  )
}