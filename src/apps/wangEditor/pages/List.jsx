import React, { useEffect, useState } from 'react';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import { Button, Input, message, Modal } from 'antd';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import '@wangeditor/editor/dist/css/style.css';

const { confirm } = Modal;

export default function List() {
  // editor 实例
  const [editor, setEditor] = useState(null)
  const [title, setTitle] = useState(null)

  // 编辑器内容
  const [html, setHtml] = useState(null)

  useEffect(() => {
    const content = localStorage.getItem('content')
    content && setHtml(content);
  }, [])

  // 编辑器配置
  const editorConfig = {                         // JS 语法
    placeholder: '请输入内容...',
  }

  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  // 工具栏配置
  const toolbarConfig = {
    excludeKeys: [
      'codeBlock',
      'group-video',
      'group-image',
      'code'
    ]
  }

  const download = () => {
    if (!title) {
      message.error('请输入标题');
      return
    }
    confirm({
      title:  `标题为 ${title}`,
      icon: <ExclamationCircleFilled />,
      content: `文件名：${title}.txt`,
      onOk: () => {
        const a = document.createElement('a');
        const file = new File([html], `${title}.txt`, { type: 'text/plain' });
        a.href = URL.createObjectURL(file);
        a.download = `${title}.txt`
        a.click();
      },
      onCancel() {
        console.log('Cancel');
      },
    });

  }

  const changeInput = (e) => {
    setTitle(e.target.value)
  }

  return <>
    <Container
      header={<Header name='关于我' />}
      main={
        <div style={{  zIndex: 100 }}>
          <Button type='primary' onClick={download}>下载</Button>
          <Input value={title} onChange={changeInput} placeholder='请输入标题/文件名' />
          <hr />

          <Toolbar
            editor={editor}
            defaultConfig={toolbarConfig}
            mode="default"
            style={{ borderBottom: '1px solid #ccc' }}
          />
          <Editor
            defaultConfig={editorConfig}
            value={html}
            onCreated={setEditor}
            onChange={editor => {
              setHtml(editor.getHtml())
            }}
            mode="default"
            style={{ height: '500px', overflowY: 'hidden' }}
          />
        </div>
      }
    />
    <Fixed />
  </>;
}
