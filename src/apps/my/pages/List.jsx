import React, { useEffect } from 'react';
import Fixed from '@components/Fixed';
import '@assets/css/index.global.less';
import Container from '@components/Container';
import Header from '@components/Header';
import style from './index.less';
import classnames from 'classnames';
import { Card, Avatar, Popover } from 'antd';
import store from '../model/store';
import { HOST } from '@utils';
import { useObserver, useLocalObservable } from 'mobx-react';
import { GithubOutlined, WechatOutlined, DingdingOutlined, MailOutlined, MobileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { formatter } from '../model/const'

export default function List() {
  const localStore = useLocalObservable(() => store);
  useEffect(() => {
    localStore.queryMyInfo();
  }, []);



  const renderMyInfo = () => {
    const { avatar } = localStore.info;
    const list = [
      { icon: <MailOutlined />, name: 'Email', label: '邮箱' },
      { icon: <MobileOutlined />, name: 'mobileNo', label: '手机号码' },
      { icon: <EnvironmentOutlined />, name: 'workerLocation', label: '工作地' },
    ];

    return <>
      <div className={style.card_body}>
        <Avatar src={`${HOST}${avatar?.url}`} size={80} />
        <div>
          <div className={style.name}>李润泉</div>
          <div className={style.introduce}>前端开发工程师</div>
        </div>

      </div>
      <div className={style.list}>
        {
          list.map(item => <div className={style.list_val}>
            <span className={style.icon}> {item.icon}  </span>
            <span className={style.val}> {localStore.info[item.name]?.val}</span>
          </div>)
        }
      </div>
    </>;
  };

  const content = (name) => {
    return <img className={style.qr} src={`${HOST}${localStore.info?.[name]?.url}`} alt="" />;
  };

  return useObserver(() => {
    const list = [
      { icon: <DingdingOutlined />, name: 'dingTalk' },
      { icon: <GithubOutlined />, name: 'git' },
      { icon: <WechatOutlined />, name: 'weChat' }
    ];
    return <>
      <Container
        header={<Header name='关于我' />}
        main={
          <div className={style.center}>
            <Card
              className={classnames('shadow_not_active', style.card)}
              style={{
                width: 300
              }}
              cover={renderMyInfo()}
              actions={
                list.map(item => <Popover trigger="click" content={() => content(item.name)}>
                  <div className="circle">{item.icon}</div>
                </Popover>)
              }
            >
            </Card>
          </div>
        }
      />
      <Fixed />
    </>;
  });
}
