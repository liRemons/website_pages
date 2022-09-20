import React from 'react';
import style from './index.module.less';
import { openApp } from 'methods-r';
import { LeftOutlined, UserOutlined } from '@ant-design/icons';
export default function Header(props) {
  const { name, rightComponent, leftComponent, leftPath } = props;
  const Home = <div className='circle' onClick={() => openApp({ url: leftPath || `/${APP_NAME}/homeList` })}><LeftOutlined /></div>;
  return <>
    <div className={style.header}>
      <div className={style.left}>
        {leftComponent}
        {Home}
      </div>
      {name}
      <div>
        {rightComponent || <div className='circle' onClick={() => openApp({ url: `/${APP_NAME}/my` })}><UserOutlined /></div>}
      </div>
    </div>
  </>;
}
