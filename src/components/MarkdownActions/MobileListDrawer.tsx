/**
 * MobileListDrawer 移动端列表抽屉（公共）
 * 左侧滑出的 antd Drawer，内部渲染文档/文章列表面板
 */
import React from 'react';
import { Drawer } from 'antd';
import { IsPC } from 'methods-r';
import { MobileListDrawerProps } from './types';
import PageList from './PageList';

export default function MobileListDrawer({ open, title, onClose, items, activeId, onItemClick, styles }: MobileListDrawerProps) {
  return (
    <Drawer
      open={open}
      styles={{ wrapper: { padding: 0 } }}
      width='80%'
      closable={false}
      placement='left'
      title={!IsPC() ? title : null}
      onClose={onClose}
    >
      <div className={styles.main}>
        <div className={styles.page_list}>
          <PageList items={items} activeId={activeId} onItemClick={onItemClick} styles={styles} />
        </div>
      </div>
    </Drawer>
  );
}
