/**
 * printPage 打印工具
 * 通过 postMessage 与打印子窗口通信，将 Markdown 内容传递到新窗口进行打印
 */
import { useEffect, useCallback, useRef } from 'react';
import { message, Modal } from 'antd';
import { DocListStore } from '../types';
import { resolvePageURL, isApp } from '@utils/nav';

export default function printPage(store: DocListStore) {
  const popupRef = useRef<Window | null>(null);

  /** 监听子窗口消息：READY 时发送数据，RESULT 时清理 */
  const onMessage = useCallback((event: MessageEvent) => {
    // App（file://）环境下 origin 为字符串 "null"，无法做来源校验，直接放行
    if (!isApp() && event.origin !== window.origin) return;
    if (event.data?.type === 'READY') {
      if (popupRef.current) {
        popupRef.current.postMessage(
          { type: 'DATA', payload: { type: 'printData', content: store.markdownInfo } },
          // file:// 下 window.origin 是非法 targetOrigin，App 环境用 '*'
          isApp() ? '*' : window.origin
        );
      }
    }
    if (event.data?.type === 'RESULT') {
      window.removeEventListener('message', onMessage);
      popupRef.current = null;
    }
  }, [store.markdownInfo]);

  /** 组件卸载时清理消息监听和弹窗 */
  useEffect(() => {
    return () => {
      window.removeEventListener('message', onMessage);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, [onMessage]);

  /** 打开打印确认弹窗，确认后打开新窗口并建立通信 */
  const toPrintPage = (): void => {
    if (!store.markdownInfo) {
      message.warning('暂无可打印内容');
      return;
    }
    Modal.confirm({
      title: '打印确认',
      content: '即将打开新窗口进行打印，是否继续？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // App 环境下 '/simpleMarkdown' 会被解析为 file:///simpleMarkdown 导致打不开
        popupRef.current = window.open(resolvePageURL('/simpleMarkdown'), '_blank');
        window.addEventListener('message', onMessage);
      },
    });
  };

  return { toPrintPage };
}