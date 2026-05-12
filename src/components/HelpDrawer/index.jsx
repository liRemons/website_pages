import React, { useState } from 'react';
import { Drawer } from 'antd';
import { marked } from 'marked';
import { img } from '@utils';
import helpSvg from './assets/svg/help.svg';
import './handle-md.global.less';
import style from './index.module.less';

// marked v18 用 use() 配置，setOptions 已废弃
marked.use({ breaks: true, gfm: true });

/**
 * 操作说明帮助抽屉
 *
 * 包含触发按钮（灯泡图标）和底部 Drawer，
 * 可在 Header、Fixed 等任意组件中复用。
 *
 * @param {string} handleContent - Markdown 格式的操作说明文本
 * @param {string} [title='操作说明'] - Drawer 标题
 */
export default function HelpDrawer({ handleContent, title = '操作说明' }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!handleContent) return null;

  return (
    <>
      <div className="circle" onClick={() => setDrawerOpen(true)} title={title}>
        {img(helpSvg, 20)}
      </div>

      <Drawer
        title={title}
        placement="bottom"
        height="70vh"
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
