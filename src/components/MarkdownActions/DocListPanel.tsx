/**
 * DocListPanel PC 端可收起的列表面板容器（公共）
 * 始终渲染，通过 className 切换实现展开/收起动画
 */
import React from 'react';
import classnames from 'classnames';
import { DocListPanelProps } from './types';
import PageList from './PageList';

export default function DocListPanel({ visible, items, activeId, onItemClick, styles }: DocListPanelProps) {
  return (
    <div className={classnames(styles.page_list, visible ? styles.page_list_visible : styles.page_list_collapsed, 'shadow_not_active')}>
      <PageList items={items} activeId={activeId} onItemClick={onItemClick} styles={styles} />
    </div>
  );
}
