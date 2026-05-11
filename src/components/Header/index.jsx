import React, { useState } from 'react';
import style from './index.module.less';
import './handle-md.global.less';
import { openApp } from 'methods-r';
import { img } from '@utils';
import { Drawer } from 'antd';
import { marked } from 'marked';
import mySvg from './assets/svg/my.svg'
import backSvg from './assets/svg/back.svg'
import helpSvg from './assets/svg/help.svg'

// marked v18 用 use() 配置，setOptions 已废弃
marked.use({ breaks: true, gfm: true });

export default function Header(props) {
  const { name, showLeft = true, showRight = true, leftPath, handleContent } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const leftComponent = props.leftComponent || (
    <div className='circle' onClick={() => openApp({ url: leftPath || `/${APP_NAME}/homeList` })}>
      {img(backSvg, 20)}
    </div>
  );

  // 有 handleContent 时，灯泡打开操作说明 Drawer；否则不渲染灯泡
  const rightComponent = props.rightComponent || (
    handleContent
      ? (
        <div className='circle' onClick={() => setDrawerOpen(true)} title='操作说明'>
          {img(helpSvg, 20)}
        </div>
      )
      : null
  );

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

    {/* 操作说明 Drawer */}
    {handleContent && (
      <Drawer
        title='操作说明'
        placement='bottom'
        height='70vh'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className={style.handleDrawer}
        styles={{
          body: { padding: '16px 20px', overflowY: 'auto' },
        }}
      >
        <div
          className="handle-md-body"
          dangerouslySetInnerHTML={{ __html: marked(handleContent) }}
        />
      </Drawer>
    )}
  </>;
}
