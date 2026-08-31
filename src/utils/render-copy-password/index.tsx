import React from 'react';
import { message } from 'antd';
import markdownItContainer from 'markdown-it-container';
import { copy } from 'methods-r';
import { typeToIcon } from '../type-to-icon';

/**
 * Render copy password component
 * 这是一个复制口令的组件
 * 使用 markdown-it-container 插件来渲染 markdown 标签
 * 支持传入的参数为 type 和 content
 * type: 平台类型，如 小红书、淘宝 等
 * icon: 图标，如 小红书的图标
 * content: 口令内容
 * 示例语法：
 * :::copyPassword {"content": "口令内容", "type": "redbook", "icon": "小红书图标"}
 */
export function renderCopyPassword(md: any) {
    md.use(markdownItContainer, 'copyPassword', {
        validate: (params: string) => {
            return params.trim().match(/^copyPassword\s*(.*)$/);
        },

        render: (tokens: any[], idx: number) => {
            const token = tokens[idx];
            const m = token.info.trim().match(/^copyPassword\s*(.*)$/);

            if (token.nesting === 1) {
                // 开始标签
                let content = '';
                let type = '';
                let icon = '';

                if (m && m[1]) {
                    try {
                        // 兼容末尾带有 ::: 的情况，去除尾部冒号
                        const configStr = m[1].trim().replace(/:+$/, '');
                        const config = JSON.parse(configStr);
                        content = config.content || '';
                        type = config.type || '';
                        icon = config.icon || '';
                    } catch (e) {
                        console.warn('[render-copy-password] Failed to parse config:', e);
                    }
                }

                const url = icon || typeToIcon(type) || '';
                const iconHtml = url && `<img src="${url}" class="copy-password-icon" />`

                return `<div class="copy-password-container" data-content="${md.utils.escapeHtml(content)}" data-type="${md.utils.escapeHtml(type)}" data-icon="${md.utils.escapeHtml(icon)}">
          <div class="copy-password-info">
            ${iconHtml}
            <span class="copy-password-content">${md.utils.escapeHtml(content)}</span>
          </div>
          <div class="copy-password-actions">
            <div class="copy-password-btn">
              <span class="copy-password-btn-icon"></span> 复制口令
            </div>
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
 * 初始化 copyPassword 容器的事件绑定和图标替换
 */
export const initCopyPasswordContainers = () => {
    // 使用事件委托处理复制按钮点击，避免重复绑定
    if (!delegatedCopyListenerAdded) {
        document.addEventListener('click', (e) => {
            const copyBtn = (e.target as HTMLElement).closest('.copy-password-btn');
            if (copyBtn) {
                const container = copyBtn.closest('.copy-password-container');
                const content = (container as HTMLElement)?.dataset.content || '';
                message.success('口令已复制到剪贴板');
                copy(content);
            }
        });
        delegatedCopyListenerAdded = true;
    }
};


export default renderCopyPassword;