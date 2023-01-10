import React from 'react';
import style from './index.module.less';
import { openApp } from 'methods-r';
import { img } from '@utils';
import mySvg from './assets/svg/my.svg'
import backSvg from './assets/svg/back.svg'
export default function Header(props) {
  const { name, showLeft = true, showRight = true, leftPath } = props;
  const leftComponent = props.leftComponent || <div className='circle' onClick={() => openApp({ url: leftPath || `/${APP_NAME}/homeList` })}>{img(backSvg, 20)}</div>;
  const rightComponent = props.rightComponent || <div className='circle' onClick={() => openApp({ url: `/${APP_NAME}/my` })}>{img(mySvg, 20)}</div>;
  return <>
    <div className={style.header}>
      <div className={style.left}>
        {showLeft && leftComponent}
      </div>
      {name}
      <div>
        {showRight && rightComponent}
      </div>
    </div>
  </>;
}
