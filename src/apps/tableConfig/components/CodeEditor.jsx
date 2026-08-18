import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Space } from 'antd';

/**
 * 代码编辑器组件
 * 用于编辑自定义渲染函数
 */
const CodeEditor = ({
  visible,
  onCancel,
  onOk,
  initialValue = '',
  title = '编辑自定义渲染函数',
  mode = 'function', // function | object
}) => {
  const [code, setCode] = useState(initialValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCode(initialValue);
    setError(null);
  }, [initialValue, visible]);

  const handleOk = () => {
    if (!code.trim()) {
      onOk('');
      return;
    }

    // 简单的语法验证
    try {
      // 尝试解析为函数
      if (mode === 'function') {
        // 检查是否是箭头函数或普通函数
        const functionPattern = /^(?:\s*(?:\([^)]*\)|\w+)\s*=>|\s*function\s*\([^)]*\)\s*\{)/;
        if (!functionPattern.test(code)) {
          // 如果不是函数格式，包装成箭头函数
          const wrappedCode = `(value, record, index) => { ${code} }`;
          new Function('return ' + wrappedCode);
        } else {
          new Function('return ' + code);
        }
      }
      onOk(code);
    } catch (err) {
      setError(`语法错误: ${err.message}`);
    }
  };

  const handleClear = () => {
    setCode('');
    setError(null);
  };

  const insertTemplate = () => {
    const templates = {
      function: [
        { label: '标签渲染', code: '(value) => <Tag color="blue">{value}</Tag>' },
        { label: '状态渲染', code: '(value) => <Badge status={value ? "success" : "error"} text={value ? "启用" : "禁用"} />' },
        { label: '链接渲染', code: '(value, record) => <a onClick={() => console.log(record)}>{value}</a>' },
        { label: '图片渲染', code: '(value) => <Image src={value} width={60} />' },
        { label: '日期格式化', code: '(value) => value && dayjs(value).format("YYYY-MM-DD HH:mm")' },
      ],
      object: [
        { label: '静态选项', code: '[{ label: "选项1", value: "1" }, { label: "选项2", value: "2" }]' },
      ],
    };

    return (
      <Space wrap style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>快速插入:</span>
        {templates[mode]?.map((template, index) => (
          <Button
            key={index}
            size="small"
            onClick={() => setCode(template.code)}
          >
            {template.label}
          </Button>
        ))}
      </Space>
    );
  };

  return (
    <Modal
      title={title}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      destroyOnClose
      footer={[
        <Button key="clear" onClick={handleClear}>
          清空
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk}>
          确定
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        {insertTemplate()}
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <div style={{ border: '1px solid #d9d9d9', borderRadius: 4 }}>
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          style={{
            width: '100%',
            minHeight: 200,
            padding: 12,
            border: 'none',
            outline: 'none',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: 13,
            lineHeight: '1.5',
            resize: 'vertical',
          }}
          placeholder={`请输入自定义渲染函数代码，例如：
(value, record, index) => {
  return <span style={{ color: value > 0 ? 'green' : 'red' }}>{value}</span>;
}`}
        />
      </div>

      <div style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
        <p>提示：</p>
        <ul style={{ paddingLeft: 16 }}>
          <li>表格列渲染函数参数: (value, record, index)</li>
          <li>{`搜索条件数据源格式: [{ label: '显示文本', value: '实际值' }]`}</li>
          <li>支持使用 Ant Design 组件如 Tag、Badge、Button 等</li>
        </ul>
      </div>
    </Modal>
  );
};

export default CodeEditor;
