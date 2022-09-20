import style from './index.module.less';
import '@assets/css/index.global.less';
import classnames from 'classnames';
import React, { useState } from 'react';
import { HomeOutlined, UserOutlined, ShareAltOutlined, LeftOutlined, RightOutlined, ToolOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { copy, openApp } from 'methods-r';

export default function Fixed() {
  const [visible, setVisible] = useState(false);
  const share = () => {
    copy(location.href);
    message.success('复制当前页面链接成功');
  };

  const go = (url) => {
    openApp({ url: `/${APP_NAME}${url}` });
  };

  const btns = [
    { icon: <HomeOutlined />, path: '/homeList', title: '首页' },
    { icon: <ShareAltOutlined />, path: '', title: '分享', handle: share },
    { icon: <UserOutlined />, path: '/my', title: '关于我' },
    { icon: <ToolOutlined />, path: '/tool', title: '工具' }
  ];

  return <>
    <div className={classnames(style.container, visible ? style.containerToRight : '')}>
      {btns.map(item => <div onClick={item.handle || (() => go(item.path))} className={classnames('circle', style.circle)}>
        {item.icon}
      </div>)}
      <div onClick={() => setVisible(!visible)} className={classnames('circle', style.circle, visible ? style.toRightIcon : '')}>
        {
          visible ? <LeftOutlined /> : <RightOutlined />
        }
      </div>

    </div>

  </>;
}
