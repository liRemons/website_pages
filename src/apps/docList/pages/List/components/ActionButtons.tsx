/**
 * ActionButtons 操作按钮组件
 * 渲染页面右侧的操作按钮栏，包括 mermaid 折叠/展开、复制 HTML、复制 Markdown、打印
 */
import React from 'react';
import classnames from 'classnames';
import { Html5TwoTone, FileMarkdownTwoTone, PrinterTwoTone, UpCircleTwoTone, DownCircleTwoTone } from '@ant-design/icons';
import { ActionButtonsProps } from '../types';

export default function ActionButtons({ mermaidCollapsed, onToggleMermaid, onCopyContent, onPrintPage, hasMermaid, styles }: ActionButtonsProps) {
  // 按钮配置列表，isShow=false 时隐藏（mermaid 按钮仅在内容包含 mermaid 时显示）
  const actions = [
    { key: 'docList-menu-mermaid-collapse', title: mermaidCollapsed ? '一键展开 mermaid' : '一键收起 mermaid', icon: mermaidCollapsed ? <DownCircleTwoTone /> : <UpCircleTwoTone />, onClick: onToggleMermaid, isShow: hasMermaid },
    { key: 'docList-menu-copyHtml', title: '复制渲染后的带格式 HTML', icon: <Html5TwoTone />, onClick: () => onCopyContent('html') },
    { key: 'docList-menu-copyMarkdown', title: '复制原始 Markdown', icon: <FileMarkdownTwoTone />, onClick: () => onCopyContent('markdown') },
    { key: 'docList-menu-print', title: '打印', icon: <PrinterTwoTone />, onClick: onPrintPage },
  ].filter(item => item.isShow !== false);

  return (
    <div className={classnames(styles.actionButtons)}>
      <div className={styles.actionPanel}>
        {actions.map(item => (
          <span className={classnames(styles.actionButton, item.key, 'circle')} key={item.key} title={item.title} onClick={item.onClick}>
            {item.icon}
          </span>
        ))}
      </div>
    </div>
  );
}