/**
 * PageNav 导航面板组件
 * 渲染右侧锚点导航栏，包含搜索框和目录树，无锚点时不显示
 */
import React from 'react';
import classnames from 'classnames';
import Anchor from '../../Anchor';
import { Input } from 'antd';
import { debounce } from 'methods-r';
import { PageNavProps } from '../types';

export default function PageNav({ anchor, htmlInfo, onSearch, styles }: PageNavProps) {
  if (!anchor?.length) return null;

  return (
    <div className={classnames(styles.page_nav, 'shadow_not_active')}>
      <div className={styles.search}>
        {/* 搜索框：防抖过滤锚点目录 */}
        <Input placeholder="请输入以搜索" onChange={(e) => debounce(onSearch(e.target.value))} />
      </div>
      {htmlInfo && <Anchor anchor={anchor} />}
    </div>
  );
}