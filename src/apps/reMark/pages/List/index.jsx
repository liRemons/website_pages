import React from 'react';
import { Alert } from 'antd';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import handleContent from '../../handle.md';
import '@assets/css/index.global.less';
import { MarkdownEditor } from 'remons-markdown-editor'
import { registerAll, excludedSelectors } from 'remons-markdown-plugins';
import 'remons-markdown-editor/style.css'
import 'remons-markdown-plugins/style.css'

import style from './index.module.less';

function List() {
  return <>
    <Container
      header={<Header name='markdown 编辑器' leftPath={`/${APP_NAME}/tool`} handleContent={handleContent} />}
      main={
        <div className={style.content}>
          <Alert type="info" message={<span>现已支持纯预览markdown组件，并支持导出/打印为PDF，<a href={`/${APP_NAME}/simpleMarkdown`} target="_blank">点击前往</a></span>} />
          <MarkdownEditor previewOptions={{
            customRenderers: [
              (md) => md.use(registerAll),
            ],
            showToc: true,
            isSlotMermaid: true,
            excludedSelectors
          }} />
        </div>}
    />
    <Fixed />
  </>
}

export default List;
