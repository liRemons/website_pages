/**
 * CollapseToggle PC 端文章列表收起/展开按钮组件
 * 功能：点击切换文章列表面板的显示/隐藏
 * 通过 className 切换（expand_toggle / collapse_toggle）实现箭头方向动画
 */
import React from 'react';
import classnames from 'classnames';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { CollapseToggleProps } from '../types';

export default function CollapseToggle({ listCollapsed, onToggle, styles }: CollapseToggleProps) {
  return (
    <div
      className={classnames(styles.collapse_toggle, listCollapsed ? styles.expand_toggle : styles.collapse_toggle, 'circle')}
      onClick={onToggle}
      title={listCollapsed ? '展开列表' : '收起列表'}
    >
      {listCollapsed ? <RightOutlined /> : <LeftOutlined />}
    </div>
  );
}