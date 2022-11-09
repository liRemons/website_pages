import style from './index.module.less';
import '@assets/css/index.global.less';
import classnames from 'classnames';
import React, { useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { copy, openApp } from 'methods-r';
import { img } from '@utils';
import homeSvg from './assets/svg/home.svg';
import shareSvg from './assets/svg/share.svg';

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
    { icon: img(homeSvg, 20), path: '/homeList', title: '首页' },
    { icon: img(shareSvg, 20), path: '', title: '分享', handle: share },
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
