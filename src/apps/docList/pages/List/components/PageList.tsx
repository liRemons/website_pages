/**
 * PageList 文章列表面板组件
 * 渲染左侧文章列表，点击切换当前文章。仅当文章数 > 1 时显示
 */
import React from 'react';
import classnames from 'classnames';
import { FileTextTwoTone } from '@ant-design/icons';
import { PageListProps } from '../types';

export default function PageList({ articleList, activeId, onPageClick, styles }: PageListProps) {
  // 文章数 ≤ 1 时不显示列表
  if (!articleList?.length || articleList.length <= 1) {
    return null;
  }

  return (
    <div className={styles.page_list_main}>
      {articleList.map(item => (
        <div
          key={item.id}
          onClick={() => onPageClick(item)}
          className={classnames(styles.page_list_title, activeId === item.id ? styles.active : '')}
        >
          <FileTextTwoTone /> {item.title}
        </div>
      ))}
    </div>
  );
}