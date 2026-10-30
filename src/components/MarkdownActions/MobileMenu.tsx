/**
 * MobileMenu 移动端左侧菜单组件（公共）
 * 功能：展示移动端操作按钮（文档列表、复制HTML、复制Markdown、打印、菜单收起/展开）
 * 通过 className 切换实现菜单滑入/滑出动画
 * 可选按钮通过回调是否传入决定：onOpenListMenu（需配合 hasList）、onPrintPage
 */
import React from 'react';
import classnames from 'classnames';
import { LeftOutlined, RightOutlined, FolderOpenTwoTone, Html5TwoTone, FileMarkdownTwoTone, PrinterTwoTone } from '@ant-design/icons';
import { MobileMenuProps } from './types';

/** 菜单项类型 */
export interface MenuItem {
  className: string;
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  isShow?: boolean;
}

export default function MobileMenu({
  prefix,
  menuVisible,
  onToggleMenu,
  onCopyContent,
  onOpenListMenu,
  onPrintPage,
  hasList,
  isShareMode,
  styles,
}: MobileMenuProps) {
  /** 构建菜单项列表 */
  const menuItems: MenuItem[] = [
    { className: `${prefix}-list`, icon: <FolderOpenTwoTone />, onClick: onOpenListMenu, isShow: !!hasList && !!onOpenListMenu && !isShareMode },
    { className: `${prefix}-copyHtml`, icon: <Html5TwoTone />, onClick: () => onCopyContent('html'), title: '复制渲染后的带格式 HTML' },
    { className: `${prefix}-copyMarkdown`, icon: <FileMarkdownTwoTone />, onClick: () => onCopyContent('markdown'), title: '复制原始 Markdown' },
    { className: `${prefix}-print`, icon: <PrinterTwoTone />, onClick: onPrintPage, title: '打印', isShow: !!onPrintPage },
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
