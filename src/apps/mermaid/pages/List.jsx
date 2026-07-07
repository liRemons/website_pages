import React, { useState, useRef, useCallback, useEffect } from 'react';
import '@assets/css/index.global.less';
import handleContent from '../handle.md';
import MermaidEditor from './components/MermaidEditor';
import MermaidPreview from './components/MermaidPreview';
import Container from '@components/Container';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import { DEFAULT_SOURCE } from './constants';
import style from './index.module.less';

/**
 * Mermaid 图表实时渲染器
 * 页面外壳（头部栏 + 全高分栏布局）自行实现，未使用共享 Container/Header/Fixed。
 */

export default function List() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [theme, setTheme] = useState('default');
  const [leftWidth, setLeftWidth] = useState(30); // 左栏宽度百分比
  const dragging = useRef(false);
  const rowRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !rowRef.current) return;
      const rect = rowRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(percent, 20), 80)); // 限制 20%~80%
    };
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <>
      <Container
        header={<Header name="Mermaid 编辑器" leftPath={`/${APP_NAME}/tool`} handleContent={handleContent} />}
        main={<div className={style.page}>
          <div className={style.panesRow} ref={rowRef}>
            <div className={style.paneLeft} style={{ width: `${leftWidth}%` }}>
              <MermaidEditor source={source} onChange={setSource} />
            </div>
            <div
              className={style.splitter}
              onMouseDown={onMouseDown}
            >
              <div className={style.splitterBar} />
            </div>
            <div className={style.paneRight} style={{ width: `${100 - leftWidth}%` }}>
              <MermaidPreview source={source} theme={theme} onThemeChange={setTheme} />
            </div>
          </div>
        </div>}
      />
      <Fixed />
    </>
  );
}