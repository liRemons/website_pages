import React, { useState } from 'react';
import { Drawer } from 'antd';
import { marked } from 'marked';
import { img } from '@utils';
import helpSvg from '@assets/svg/help.svg';
import './handle-md.global.less';
import style from './index.module.less';

marked.use({ breaks: true, gfm: true });

export default function HelpDrawer({ handleContent, title = '操作说明', placement = 'bottom' }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!handleContent) return null;

  return (
    <>
      <div className="circle" onClick={() => setDrawerOpen(true)} title={title}>
        {img(helpSvg, 20)}
      </div>

      <Drawer
        title={title}
        placement={placement}
        height={placement === 'bottom' ? '70vh' : undefined}
        width={placement === 'right' ? 480 : undefined}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
        extra={
          <div className={style.drawerCloseBtn} onClick={() => setDrawerOpen(false)}>✕</div>
        }
        styles={{
          body: { padding: '16px 20px', overflowY: 'auto' },
        }}
      >
        <div
          className="handle-md-body"
          dangerouslySetInnerHTML={{ __html: marked(handleContent) }}
        />
      </Drawer>
    </>
  );
}
