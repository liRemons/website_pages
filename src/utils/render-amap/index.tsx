import React from 'react';
import { createRoot } from 'react-dom/client';
import { message } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import markdownItContainer from 'markdown-it-container';
import { copy } from 'methods-r';
import { typeToIcon } from '../type-to-icon';

/**
 * 渲染高德地图链接容器
 * 语法: :::amap {"url": "xxx", "label": "地址"}
 */
export function renderAmap(md: any) {
  md.use(markdownItContainer, 'amap', {
    validate: (params: string) => {
      return params.trim().match(/^amap\s*(.*)$/);
    },

    render: (tokens: any[], idx: number) => {
      const token = tokens[idx];
      const m = token.info.trim().match(/^amap\s*(.*)$/);

      if (token.nesting === 1) {
        // 开始标签
        let url = '';
        let label = '';

        if (m && m[1]) {
          try {
            // 兼容末尾带有 ::: 的情况，去除尾部冒号
            const configStr = m[1].trim().replace(/:+$/, '');
            const config = JSON.parse(configStr);
            url = config.url || '';
            label = config.label || '';
          } catch (e) {
            console.warn('[render-amap] Failed to parse config:', e);
          }
        }

        return `<div class="amap-container" data-url="${md.utils.escapeHtml(url)}" data-label="${md.utils.escapeHtml(label)}">
        <span class="amap-label">
          <img src="${typeToIcon('amap')}" />
          <span class="amap-label-text">${md.utils.escapeHtml(label)}</span>
        </span>  
        <div class="amap-actions">
            <div class="amap-copy-btn">
              <span class="amap-icon"></span> 复制地址
            </div>
            <a href="${md.utils.escapeHtml(url)}" target="_blank" rel="noopener" class="amap-link-btn">
              <span class="amap-icon amap-link-icon"></span> 打开导航
            </a>
          </div>
        </div>`;
      } else {
        // 结束标签
        return '</div>';
      }
    },
  });
}


/** 标记是否已绑定事件委托 */
let delegatedCopyListenerAdded = false;

/**
 * 初始化 amap 容器的事件绑定和图标替换
 */
export const initAmapContainers = () => {
  // 使用事件委托处理复制按钮点击，避免重复绑定
  if (!delegatedCopyListenerAdded) {
    document.addEventListener('click', (e) => {
      const copyBtn = (e.target as HTMLElement).closest('.amap-copy-btn');
      if (copyBtn) {
        const container = copyBtn.closest('.amap-container');
        const label = (container as HTMLElement)?.dataset.label || '';
        message.success('地址已复制到剪贴板');
        copy(label);
      }
    });
    delegatedCopyListenerAdded = true;
  }

  // 渲染链接按钮图标
  document.querySelectorAll('.amap-container').forEach((container) => {
    const linkBtn = container.querySelector('.amap-link-btn');
    if (linkBtn) {
      const iconSpan = linkBtn.querySelector('.amap-icon');
      if (iconSpan) {
        const root = createRoot(iconSpan);
        root.render(<ExportOutlined style={{ fontSize: '16px' }} />);
      }
    }
  });
};


export default renderAmap;
