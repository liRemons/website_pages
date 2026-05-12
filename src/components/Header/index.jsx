import React from 'react';
import style from './index.module.less';
import { openApp } from 'methods-r';
import { img } from '@utils';
import backSvg from './assets/svg/back.svg'
import HelpDrawer from '../HelpDrawer';

export default function Header(props) {
  const { name, showLeft = true, showRight = true, leftPath, handleContent } = props;

  const leftComponent = props.leftComponent || (
    <div className='circle' onClick={() => openApp({ url: leftPath || `/${APP_NAME}/homeList` })}>
      {img(backSvg, 20)}
    </div>
  );

  // 有 handleContent 时，右侧渲染 HelpDrawer；否则不渲染
  const rightComponent = props.rightComponent || (
    handleContent ? <HelpDrawer handleContent={handleContent} /> : null
  );

  return (
    <div className={style.header}>
      <div className={style.left}>
        {showLeft && leftComponent}
      </div>
      {name}
      <div>
        {showRight && rightComponent}
      </div>
    </div>
  );
}
