import React, { useState, useEffect } from 'react';
import { Menu, Alert } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import handleContent from '../../handle.md';
import style from './index.module.less';
import '@assets/css/index.global.less';

import { MarkdownEditor, useRegisterToolbar } from 'remons-markdown-editor'
import { registerAll, excludedSelectors } from 'remons-markdown-plugins';
import 'remons-markdown-editor/style.css'
import 'remons-markdown-plugins/style.css'


function List() {
  useRegisterToolbar({
    name: 'badge',
    label: '警告框',
    icon: <AlertOutlined />,
    fields: [{ key: 'type', defaultValue: 'price' }, { key: 'content', defaultValue: 'ce' }],
    renderDialog: (props, onChange) => (
      <Input value={props.level} onChange={e => onChange('level', e.target.value)} />
    ),
  })

  return <>
    <Fixed />
    <Container
      header={<Header name='所见即所得 markdown 编辑查看器' leftPath={`/${APP_NAME}/tool`} handleContent={handleContent} />}
      main={<>
        <div className={style.main}>
          <div className={style.content}>
            <Alert type="info" message={<span>现已支持纯预览markdown组件，并支持导出/打印为PDF，<a href={`/${APP_NAME}/simpleMarkdown`} target="_blank">点击前往</a></span>} />
            <MarkdownEditor previewOptions={{
              customRenderers: [
                (md) => md.use(registerAll),
              ],
              excludedSelectors
            }} />
          </div>
        </div></>}
    >
    </Container>
  </>
}

export default List;
