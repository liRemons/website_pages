import React, { useState } from 'react';
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

  return (
    <>
      <Container
        header={<Header name="Mermaid 编辑器" leftPath={`/${APP_NAME}/tool`} handleContent={handleContent} />}
        main={<div className={style.page}>
          <div className={style.panesRow}>
            <MermaidEditor source={source} onChange={setSource} />
            <MermaidPreview source={source} theme={theme} onThemeChange={setTheme} />
          </div>
        </div>}
      />
      <Fixed />
    </>
  );
}
