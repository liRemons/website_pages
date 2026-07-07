import React from 'react';
import { Button, Dropdown, Space, Tooltip, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import CodeMirror from '@uiw/react-codemirror';
import { copy } from 'methods-r';
import { TEMPLATES } from '../constants';
import style from '../index.module.less';

/**
 * 左栏：Mermaid 源码编辑器
 * - CodeMirror（带行号、轻量）
 * - 工具栏：插入模板 / 复制源码 / 清空
 */
export default function MermaidEditor({ source, onChange }) {
  const handleTemplate = ({ key }) => {
    const item = TEMPLATES.find((t) => t.value === key);
    if (item) {
      onChange(item.code);
      message.success(`已插入「${item.label}」模板`);
    }
  };

  const handleClear = () => {
    onChange('');
    message.success('已清空');
  };

  const handleCopy = () => {
    if (!source.trim()) {
      message.warning('内容为空');
      return;
    }
    copy(source);
    message.success('已复制源码');
  };

  const menuProps = {
    items: TEMPLATES.map((t) => ({ key: t.value, label: t.label })),
    onClick: handleTemplate,
  };

  return (
    <div className={style.leftPane}>
      <div className={style.paneHeader}>
        <span className={style.paneTitle}>源码编辑</span>
        <Space size={6} wrap>
          <Dropdown menu={menuProps} trigger={['click']}>
            <Button size="small" icon={<PlusOutlined />}>
              插入模板
            </Button>
          </Dropdown>
          <Tooltip title="复制源码">
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} />
          </Tooltip>
          <Tooltip title="清空">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleClear} />
          </Tooltip>
        </Space>
      </div>
      <div className={style.editorWrap}>
        <CodeMirror
          value={source}
          height="100%"
          theme="light"
          onChange={onChange}
          placeholder="在此输入 Mermaid 源码，右侧实时渲染…"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            foldGutter: false,
            autocompletion: false,
            highlightSelectionMatches: false,
          }}
          className={style.cmWrap}
        />
      </div>
    </div>
  );
}
