import React from 'react';
import { createRoot } from 'react-dom/client';
import markdownItContainer from 'markdown-it-container';
import JSON5 from 'json5';

/**
 * 解析 markdown-it-container 的配置 JSON
 * 通用方法，抽取了容器标签解析配置的公共逻辑
 * @param tokenInfo token.info 字符串
 * @param tagName 容器标签名（如 'amap', 'copyPassword'）
 * @returns 解析后的配置对象，解析失败返回空对象
 */
export function parseContainerConfig(tokenInfo: string, tagName: string): Record<string, string> {
  const m = tokenInfo.trim().match(new RegExp(`^${tagName}\\s*(.*)$`));
  if (m && m[1]) {
    try {
      // 兼容末尾带有 ::: 的情况，去除 ::: 及之后的内容
      const configStr = m[1].trim().split(':::')[0].trim();
      return JSON5.parse(configStr);
    } catch (e) {
      console.warn(`[${tagName}] Failed to parse config:`, e);
    }
  }
  return {};
}

/**
 * 创建 markdown-it-container 插件
 * 抽取了 validate 和 render 骨架的公共逻辑
 * @param md markdown-it 实例
 * @param tagName 容器标签名
 * @param renderOpen 渲染开始标签的回调，接收 (config, md)，返回 HTML 字符串
 */
export function createContainerPlugin(
  md: any,
  tagName: string,
  renderOpen: (config: Record<string, string>, md: any, isBlock?: boolean) => string,
) {
  // 添加 inline rule 处理单行完整容器 :::tagName{...}:::
  md.inline.ruler.before('escape', `${tagName}_inline`, (state: any, silent: boolean) => {
    const src = state.src.slice(state.pos);
    // 匹配 :::tagName{...}:::
    const match = src.match(new RegExp(`^:::${tagName}\\s*(\\{[^}]*\\}):::`));
    if (!match) return false;

    if (!silent) {
      const token = state.push(`${tagName}_inline`, '', 0);
      token.content = match[1];
    }

    state.pos += match[0].length;
    return true;
  });

  // 添加 inline render rule
  md.renderer.rules[`${tagName}_inline`] = (tokens: any[], idx: number) => {
    const token = tokens[idx];
    try {
      const config = JSON5.parse(token.content);
      return renderOpen(config, md, false);
    } catch (e) {
      console.warn(`[${tagName}] Failed to parse inline config:`, e);
      return '';
    }
  };

  md.use(markdownItContainer, tagName, {
    validate: (params: string) => {
      const m = params.trim().match(new RegExp(`^${tagName}\\s*(.*)$`));
      if (!m) return false;
      // 如果包含 :::，说明是单行完整容器，交给 inline rule 处理
      if (m[1].includes(':::')) return false;
      return true;
    },
    render: (tokens: any[], idx: number) => {
      const token = tokens[idx];
      if (token.nesting === 1) {
        const config = parseContainerConfig(token.info, tagName);
        return renderOpen(config, md, true);
      } else {
        return '</div>';
      }
    },
  });
}

/**
 * 创建 markdown-it-container 容器组件
 * 极致封装：只需提供 tagName 和 React 组件，自动处理解析、占位、挂载
 * @param tagName 容器标签名
 * @param Component React 组件，接收 config 中各字段作为 props
 * @returns render(md) 注册插件，自动通过 MutationObserver 挂载组件
 */
export function createContainerComponent(tagName: string) {
  return (Component: React.FC<any>): (md: any) => void => {
    const placeholderAttr = `data-${tagName}-placeholder`;

    const mount = (el: HTMLElement) => {
      const props: Record<string, string> = {};
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-') && !attr.name.endsWith('-placeholder')) {
          props[attr.name.slice(5)] = attr.value;
        }
      }
      if (Object.keys(props).length === 0) {
        const textContent = el.textContent?.trim();
        if (textContent) {
          props.content = textContent;
        }
      }
      el.removeAttribute(placeholderAttr);
      createRoot(el).render(React.createElement(Component, props));
    };

    // Auto-mount: 通过 MutationObserver 监听 DOM 中新增的占位符并自动挂载
    if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
      const startObserver = () => {
        // 先挂载已存在的占位符
        document.querySelectorAll<HTMLElement>(`[${placeholderAttr}]`).forEach(mount);
        // 持续监听新加入的占位符
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLElement) {
                if (node.matches(`[${placeholderAttr}]`)) mount(node);
                node.querySelectorAll<HTMLElement>(`[${placeholderAttr}]`).forEach(mount);
              }
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
      } else {
        startObserver();
      }
    }

    return (md: any) => {
      createContainerPlugin(md, tagName, (config, md, isBlock) => {
        const dataAttrs = Object.entries(config)
          .map(([key, val]) => `data-${key}="${md.utils.escapeHtml(val || '')}"`)
          .join(' ');
        const className = `render-md-plugin-${tagName}-container ${config.class || ''}`;
        if (isBlock) {
          return `<div class="${className}" ${placeholderAttr} ${dataAttrs}>`;
        }
        return `<span class="${className}" ${placeholderAttr} ${dataAttrs}></span>`;
      });
    };
  };
}