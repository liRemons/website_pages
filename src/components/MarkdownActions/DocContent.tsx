/**
 * DocContent Markdown 内容区容器（公共）
 * 提供 page_main / markdown_main 结构与全局标记类，
 * 是否有内容时渲染什么（Markdown 组件 / Empty）由页面通过 render-prop 决定
 */
import React from 'react';
import classnames from 'classnames';
import { DocContentProps } from './types';

export default function DocContent({ hasContent, children, styles }: DocContentProps) {
  return (
    <div className={classnames(styles.page_main, 'shadow_not_active', 'markdown_screen')}>
      <div className={classnames(styles.markdown_main, 'markdown-main-content')}>
        {children(hasContent)}
      </div>
    </div>
  );
}
