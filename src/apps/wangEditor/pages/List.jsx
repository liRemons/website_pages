import React, { useEffect, useRef, useState } from 'react';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import { Input, message, Modal } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import handleContent from '../handle.md';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';
import style from './index.module.less';

export default function List() {
  const [editor, setEditor] = useState(null);
  const [html, setHtml] = useState(null);
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [title, setTitle] = useState('');
  const titleInputRef = useRef(null);

  useEffect(() => {
    const content = localStorage.getItem('content');
    content && setHtml(content);
  }, []);

  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const editorConfig = {
    placeholder: '请输入内容...',
  };

  const toolbarConfig = {
    excludeKeys: ['codeBlock', 'group-video', 'group-image', 'code'],
  };

  const openDownloadModal = () => {
    setTitle('');
    setDownloadVisible(true);
    // 等 Modal 渲染后自动聚焦输入框
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const confirmDownload = () => {
    if (!title.trim()) {
      message.error('请输入文件名');
      return;
    }
    const fileName = title.trim();
    const a = document.createElement('a');
    const file = new File([html || ''], `${fileName}.txt`, { type: 'text/plain' });
    a.href = URL.createObjectURL(file);
    a.download = `${fileName}.txt`;
    a.click();
    setDownloadVisible(false);
  };

  return <>
    <Container
      header={<Header name='富文本编辑器' handleContent={handleContent} />}
      main={
        <div className={style.page}>
          {/* 编辑器卡片 */}
          <div className={style.editorCard}>
            <Toolbar
              editor={editor}
              defaultConfig={toolbarConfig}
              mode="default"
              className={style.editorToolbar}
            />
            <Editor
              defaultConfig={editorConfig}
              value={html}
              onCreated={setEditor}
              onChange={editorInstance => {
                setHtml(editorInstance.getHtml());
                localStorage.setItem('content', editorInstance.getHtml());
              }}
              mode="default"
              className={style.editorBody}
            />
          </div>

          {/* 悬浮下载按钮 */}
          <button className={style.floatDownloadBtn} onClick={openDownloadModal} title="下载">
            <DownloadOutlined />
          </button>
        </div>
      }
    />

    {/* 下载 Modal：输入文件名 */}
    <Modal
      title="下载文件"
      open={downloadVisible}
      onOk={confirmDownload}
      onCancel={() => setDownloadVisible(false)}
      okText="下载"
      cancelText="取消"
      width={320}
    >
      <Input
        ref={titleInputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onPressEnter={confirmDownload}
        placeholder="请输入文件名"
        suffix=".txt"
        allowClear
      />
    </Modal>

    <Fixed />
  </>;
}
