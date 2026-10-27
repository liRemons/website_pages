/**
 * PageList 文档/文章列表面板组件（公共）
 * 渲染左侧列表，点击切换当前项。仅当条目数 > 1 时显示
 */
import React from 'react';
import classnames from 'classnames';
import { FileTextTwoTone } from '@ant-design/icons';
import { PageListProps } from './types';

export default function PageList({ items, activeId, onItemClick, styles }: PageListProps) {
  // 条目数 ≤ 1 时不显示列表
  if (!items?.length || items.length <= 1) {
    return null;
  }

  return (
    <div className={styles.page_list_main}>
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className={classnames(styles.page_list_title, activeId === item.id ? styles.active : '')}
        >
          <FileTextTwoTone /> {item.title}
        </div>
      ))}
    </div>
  );
}
