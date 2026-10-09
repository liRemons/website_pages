/**
 * PageList 文档列表面板组件
 * 渲染左侧文档列表，点击切换当前文档。仅当文档数 > 1 时显示
 */
import React from 'react';
import classnames from 'classnames';
import { FileTextTwoTone } from '@ant-design/icons';
import { PageListProps } from '../types';

export default function PageList({ docList, activeDocId, onDocClick, styles }: PageListProps) {
  // 文档数 ≤ 1 时不显示列表
  if (!docList?.length || docList.length <= 1) {
    return null;
  }

  return (
    <div className={styles.page_list_main}>
      {docList.map(item => (
        <div
          key={item.id}
          onClick={() => onDocClick(item)}
          className={classnames(styles.page_list_title, activeDocId === item.id ? styles.active : '')}
        >
          <FileTextTwoTone /> {item.title}
        </div>
      ))}
    </div>
  );
}