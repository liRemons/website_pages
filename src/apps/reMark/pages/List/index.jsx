import React from 'react';
import { Alert, Input } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import handleContent from '../../handle.md';
import '@assets/css/index.global.less';
import { MarkdownEditor, useRegisterToolbar } from 'remons-markdown-editor'
import { registerAll, excludedSelectors } from 'remons-markdown-plugins';
import 'remons-markdown-editor/style.css'
import 'remons-markdown-plugins/style.css'

import style from './index.module.less';

function List() {
  useRegisterToolbar({
    name: 'badge',
    label: '警告框',
    icon: <AlertOutlined />,
    fields: [{ key: 'type', defaultValue: 'price' }, { key: 'content', defaultValue: 'ce' }],
    renderDialog: (props, onChange) => (
      <Input value={props.level} onChange={e => onChange('content', e.target.value)} />
    ),
  })

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
            excludedSelectors
          }} />
        </div>}
    />
    <Fixed />
  </>
}

export default List;
