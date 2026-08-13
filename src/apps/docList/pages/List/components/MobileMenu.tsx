/**
 * MobileMenu 移动端左侧菜单组件
 * 功能：展示移动端操作按钮（导航、列表、复制HTML、复制Markdown、打印、菜单收起/展开）
 * 通过 className 切换实现菜单滑入/滑出动画
 */
import React from 'react';
import classnames from 'classnames';
import { LeftOutlined, RightOutlined, FolderOpenTwoTone, ProfileTwoTone, Html5TwoTone, FileMarkdownTwoTone, PrinterTwoTone } from '@ant-design/icons';
import { MobileMenuProps, MenuItem } from '../types';

export default function MobileMenu({
  menuVisible,
  onToggleMenu,
  onOpenListMenu,
  onOpenListNav,
  onCopyContent,
  onPrintPage,
  hasAnchor,
  hasMultipleArticles,
  styles,
}: MobileMenuProps) {
  /** 构建菜单项列表 */
  const menuItems: MenuItem[] = [
    { className: 'docList-menu-anchor', icon: <ProfileTwoTone />, onClick: onOpenListNav, isShow: hasAnchor },
    { className: 'docList-menu-list', icon: <FolderOpenTwoTone />, onClick: onOpenListMenu, isShow: hasMultipleArticles },
    { className: 'docList-menu-copyHtml', icon: <Html5TwoTone />, onClick: () => onCopyContent('html'), title: '复制渲染后的带格式 HTML' },
    { className: 'docList-menu-copyMarkdown', icon: <FileMarkdownTwoTone />, onClick: () => onCopyContent('markdown'), title: '复制原始 Markdown' },
    { className: 'docList-menu-print', icon: <PrinterTwoTone />, onClick: onPrintPage, title: '打印' },
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