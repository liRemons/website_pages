import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Button, 
  Space, 
  Table,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Select,
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CodeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import CodeEditor from '../CodeEditor';

const { Option } = Select;

/**
 * 表格列配置组件
 */
const TableConfig = ({ value = [], onChange }) => {
  const [form] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState(null);
  const [codeEditorVisible, setCodeEditorVisible] = useState(false);
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [codeEditorCallback, setCodeEditorCallback] = useState(null);

  const columns = value || [];

  const handleAdd = () => {
    const newColumn = {
      title: '',
      dataIndex: '',
      key: '',
      width: 150,
      fixed: false,
      align: 'left',
      ellipsis: false,
      sorter: false,
      render: '',
    };
    onChange([...columns, newColumn]);
    setEditingIndex(columns.length);
  };

  const handleDelete = (index) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    onChange(newColumns);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleMove = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newColumns = [...columns];
      [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
      onChange(newColumns);
      setEditingIndex(index - 1);
    } else if (direction === 'down' && index < columns.length - 1) {
      const newColumns = [...columns];
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      onChange(newColumns);
      setEditingIndex(index + 1);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    form.setFieldsValue(columns[index]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newColumns = [...columns];
      // 如果没有设置 key，使用 dataIndex 作为 key
      if (!values.key && values.dataIndex) {
        values.key = values.dataIndex;
      }
      newColumns[editingIndex] = { ...newColumns[editingIndex], ...values };
      onChange(newColumns);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const openCodeEditor = (value, callback) => {
    setCodeEditorValue(value || '');
    setCodeEditorCallback(callback);
    setCodeEditorVisible(true);
  };

  const handleCodeEditorOk = (code) => {
    if (codeEditorCallback) {
      codeEditorCallback(code);
    }
    setCodeEditorVisible(false);
  };

  const tableColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '列名',
      dataIndex: 'title',
      width: 120,
    },
    {
      title: '字段',
      dataIndex: 'dataIndex',
      width: 120,
    },
    {
      title: '宽度',
      dataIndex: 'width',
      width: 80,
    },
    {
      title: '对齐',
      dataIndex: 'align',
      width: 80,
      render: (align) => align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐',
    },
    {
      title: '自定义渲染',
      dataIndex: 'render',
      width: 100,
      render: (render) => render ? '有' : '无',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title="上移">
            <Button 
              type="text" 
              icon={<ArrowUpOutlined />} 
              onClick={() => handleMove(index, 'up')}
              disabled={index === 0}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button 
              type="text" 
              icon={<ArrowDownOutlined />} 
              onClick={() => handleMove(index, 'down')}
              disabled={index === columns.length - 1}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(index)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除吗?"
            onConfirm={() => handleDelete(index)}
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加表格列
        </Button>
      </div>

      <Table
        dataSource={columns}
        columns={tableColumns}
        rowKey={(record, index) => index}
        pagination={false}
        size="small"
        bordered
      />

      {editingIndex !== null && columns[editingIndex] && (
        <Card 
          title={`编辑表格列 - ${columns[editingIndex].title || '未命名'}`} 
          style={{ marginTop: 16 }}
          extra={
            <Space>
              <Button onClick={() => setEditingIndex(null)}>取消</Button>
              <Button type="primary" onClick={handleSave}>保存</Button>
            </Space>
          }
        >
          <Form
            form={form}
            initialValues={columns[editingIndex]}
            layout="vertical"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="列名称"
                  rules={[{ required: true, message: '请输入列名称' }]}
                >
                  <Input placeholder="例如: 用户名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dataIndex"
                  label="字段名 (dataIndex)"
                  rules={[{ required: true, message: '请输入字段名' }]}
                >
                  <Input placeholder="例如: username" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="key"
                  label="唯一标识 (key)"
                  tooltip="如果不填写，将使用 dataIndex 作为 key"
                >
                  <Input placeholder="可选，用于唯一标识该列" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="width"
                  label="列宽"
                >
                  <InputNumber 
                    min={50} 
                    max={1000} 
                    placeholder="请输入列宽" 
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="align"
                  label="对齐方式"
                >
                  <Select placeholder="选择对齐方式">
                    <Option value="left">左对齐</Option>
                    <Option value="center">居中</Option>
                    <Option value="right">右对齐</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="fixed"
                  label="固定列"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="ellipsis"
                  label="自动省略"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="sorter"
                  label="支持排序"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="自定义渲染函数">
              <Tooltip title="编辑自定义渲染函数">
                <Button 
                  icon={<CodeOutlined />}
                  onClick={() => {
                    const render = form.getFieldValue('render');
                    openCodeEditor(
                      render,
                      (code) => form.setFieldsValue({ render: code })
                    );
                  }}
                >
                  {form.getFieldValue('render') ? '修改渲染函数' : '添加渲染函数'}
                </Button>
              </Tooltip>
              {form.getFieldValue('render') && (
                <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  <code style={{ fontSize: 12 }}>{form.getFieldValue('render')}</code>
                </div>
              )}
            </Form.Item>
          </Form>
        </Card>
      )}

      <CodeEditor
        visible={codeEditorVisible}
        onCancel={() => setCodeEditorVisible(false)}
        onOk={handleCodeEditorOk}
        initialValue={codeEditorValue}
        mode="function"
        title="编辑自定义渲染函数"
      />
    </div>
  );
};

export default TableConfig;
