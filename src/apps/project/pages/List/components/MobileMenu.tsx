/**
 * MobileMenu 移动端左侧菜单组件
 * 功能：展示移动端操作按钮（文档列表、菜单收起/展开）
 * 通过 className 切换实现菜单滑入/滑出动画
 */
import React from 'react';
import classnames from 'classnames';
import { LeftOutlined, RightOutlined, FolderOpenTwoTone } from '@ant-design/icons';
import { MobileMenuProps, MenuItem } from '../types';

export default function MobileMenu({
  menuVisible,
  onToggleMenu,
  onOpenListMenu,
  hasMultipleDocs,
  styles,
}: MobileMenuProps) {
  /** 构建菜单项列表 */
  const menuItems: MenuItem[] = [
    { className: 'project-menu-list', icon: <FolderOpenTwoTone />, onClick: onOpenListMenu, isShow: hasMultipleDocs },
    { className: menuVisible ? styles.toRightIcon : '', icon: menuVisible ? <RightOutlined /> : <LeftOutlined />, onClick: onToggleMenu, isShow: true }
  ];

  return (
    <div className={classnames(styles.h5_menu, menuVisible ? styles.menuLeft : styles.menuLeftNone)}>
      {menuItems.filter(item => item.isShow !== false).map(item => (
        <span className={classnames(item.className, 'circle')} key={item.className} onClick={item.onClick} title={item.title}>{item.icon}</span>
      ))}
    </div>
  );
}