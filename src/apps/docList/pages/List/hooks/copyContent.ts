/**
 * copyContent 复制工具
 * 提供复制 HTML（带格式）和 Markdown（纯文本）的功能
 * 优先使用 Clipboard API，降级到 execCommand 方案
 */
import { message } from 'antd';
import { CopyType, DocListStore } from '../types';

/** 兼容方案：通过 textarea 复制纯文本 */
const copyTextByCommand = (text: string): void => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

/** 兼容方案：通过 contentEditable div 复制带格式 HTML */
const copyHtmlByCommand = (html: string): void => {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.contentEditable = 'true';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.execCommand('copy');
  selection?.removeAllRanges();
  document.body.removeChild(container);
};

/** 递归移除克隆 DOM 中被隐藏的子节点（display:none / visibility:hidden） */
const removeHiddenNodes = (sourceNode: Element, cloneNode: Element): void => {
  const cloneChildren = Array.from(cloneNode.children);
  Array.from(sourceNode.children).forEach((sourceChild, index) => {
    const cloneChild = cloneChildren[index] as Element | undefined;
    if (!cloneChild) return;
    const computedStyle = window.getComputedStyle(sourceChild);
    const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
    if (isHidden) {
      cloneChild.remove();
      return;
    }
    removeHiddenNodes(sourceChild, cloneChild);
  });
};

/** 获取可见区域的 HTML（移除隐藏节点和代码块操作按钮） */
const getVisibleHtml = (htmlInfo: string): string => {
  const markdownDom = document.querySelector('.markdown-html > div');
  if (!markdownDom) return htmlInfo;
  const cloneDom = markdownDom.cloneNode(true) as Element;
  removeHiddenNodes(markdownDom, cloneDom);
  cloneDom.querySelectorAll('.copy, .code-toggle').forEach(item => item.remove());
  return cloneDom.innerHTML;
};

/** 从 HTML 字符串提取纯文本 */
const getPlainTextFromHtml = (html: string): string => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.innerText;
};

/**
 * 复制内容工厂函数
 * @param store - DocListStore 实例
 * @returns copyContent - 执行复制的方法
 */
export default function copyContent(store: DocListStore) {
  const copy = async (type: CopyType): Promise<void> => {
    const isHtml = type === 'html';
    const content = isHtml ? getVisibleHtml(store.htmlInfo) : store.markdownInfo;
    if (!content) {
      message.warning('暂无可复制内容');
      return;
    }
    try {
      // 优先使用 Clipboard API（支持富文本）
      if (isHtml && navigator.clipboard?.write && window.ClipboardItem) {
        const clipboardItem = new window.ClipboardItem({
          'text/html': new Blob([content], { type: 'text/html' }),
          'text/plain': new Blob([getPlainTextFromHtml(content)], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else if (isHtml) {
        copyHtmlByCommand(content);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        copyTextByCommand(content);
      }
      message.success(isHtml ? '已复制带格式 HTML' : '已复制 Markdown');
    } catch {
      // Clipboard API 失败时降级到 execCommand
      isHtml ? copyHtmlByCommand(content) : copyTextByCommand(content);
      message.success(isHtml ? '已复制带格式 HTML' : '已复制 Markdown');
    }
  };

  return { copyContent: copy };
}