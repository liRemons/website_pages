import { useEffect } from 'react';
import classNames from 'classnames';
import { useObserver, useLocalObservable } from 'mobx-react';
import { List, Card, Button } from 'antd';
import { HOST } from '../model/const';
import store from '../model/store';
import '@assets/css/index.global.less'
import style from './index.less';
export default function HomeList() {

  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    localStore.queryTechClassList();
  }, []);

  return useObserver(() => <> <div className={style.container}><List
    grid={{ gutter: 24, column: 4 }}
    dataSource={localStore.techClassList || []}
    renderItem={item => (
      <List.Item className={classNames('shadow', style.cardItem)}>
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