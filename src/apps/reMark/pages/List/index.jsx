import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Alert, message } from 'antd';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import handleContent from '../../handle.md';
import '@assets/css/index.global.less';
import { resolvePageURL } from '@utils/nav';
import { MarkdownEditor } from 'remons-markdown-editor'
import { registerAll, excludedSelectors } from 'remons-markdown-plugins';
import 'remons-markdown-editor/style.css'
import 'remons-markdown-plugins/style.css'

import style from './index.module.less';

// 本地存储 key
const STORAGE_KEY = 'remark_local_content';

function List() {
  const editorRef = useRef(null);
  // 初始内容：从本地存储恢复（页面刷新后取回）
  const [initialContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  });
  // 记录上次已保存的内容，避免重复写入
  const lastSavedRef = useRef(initialContent);

  // 保存内容到本地存储（showTip 为 true 时提示）
  const saveToLocal = useCallback((showTip = false) => {
    const content = editorRef.current?.getContent?.();
    if (content && content !== lastSavedRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY, content);
        lastSavedRef.current = content;
        if (showTip) message.success('已保存到本地');
      } catch (e) {
        console.warn('保存 markdown 内容到本地存储失败', e);
        if (showTip) message.warning('保存到本地存储失败');
      }
    } else if (showTip) {
      message.success('已保存到本地');
    }
  }, []);

  useEffect(() => {
    // 每 10s 保存一次内容到本地存储
    const timer = setInterval(() => {
      saveToLocal();
    }, 10000);
    return () => clearInterval(timer);
  }, [saveToLocal]);

  useEffect(() => {
    // 拦截 Ctrl+S / Cmd+S 快捷键保存
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        saveToLocal(true);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [saveToLocal]);

  return <>
    <Container
      header={<Header name='markdown 编辑器' leftPath='/tool' handleContent={handleContent} />}
      main={
        <div className={style.content}>
          <Alert type="info" message={<span>现已支持纯预览markdown组件，并支持导出/打印为PDF，<a href={resolvePageURL('/simpleMarkdown')} target="_blank">点击前往</a></span>} />
          <MarkdownEditor
            ref={editorRef}
            defaultValue={initialContent}
            previewOptions={{
              customRenderers: [
                (md) => md.use(registerAll),
              ],
              showToc: true,
              isSlotMermaid: true,
              excludedSelectors
            }}
          />
        </div>}
    />
    <Fixed />
  </>
}

export default List;
