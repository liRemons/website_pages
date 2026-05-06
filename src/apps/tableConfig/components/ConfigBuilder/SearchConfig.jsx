import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Table,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Modal,
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CodeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { Form as RemonsForm, FormItem } from 'remons-components';
import CodeEditor from '../CodeEditor';

/**
 * 搜索条件配置组件
 */
const SearchConfig = ({ value = [], onChange }) => {
  const [form] = RemonsForm.useForm();
  const [editingIndex, setEditingIndex] = useState(null);
  const [codeEditorVisible, setCodeEditorVisible] = useState(false);
  const [codeEditorMode, setCodeEditorMode] = useState('function');
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [codeEditorCallback, setCodeEditorCallback] = useState(null);
  const [codeEditorTitle, setCodeEditorTitle] = useState('');

  const fields = value || [];

  // 支持的组件类型（remons-components 内置组件）
  const componentTypes = [
    { value: 'input', label: '文本输入', category: '基础' },
    { value: 'inputPassword', label: '密码输入', category: '基础' },
    { value: 'textarea', label: '文本域', category: '基础' },
    { value: 'inputNumber', label: '数字输入', category: '基础' },
    { value: 'rangeInput', label: '范围输入', category: '基础' },
    { value: 'sizeInput', label: '尺寸输入', category: '基础' },
    { value: 'select', label: '下拉选择', category: '选择' },
    { value: 'treeSelect', label: '树选择', category: '选择' },
    { value: 'cascader', label: '级联选择', category: '选择' },
    { value: 'datePicker', label: '日期选择', category: '日期时间' },
    { value: 'rangePicker', label: '日期范围', category: '日期时间' },
    { value: 'timePicker', label: '时间选择', category: '日期时间' },
    { value: 'rangeTimePicker', label: '时间范围', category: '日期时间' },
    { value: 'radio', label: '单选', category: '选择' },
    { value: 'radioGroup', label: '单选组', category: '选择' },
    { value: 'checkbox', label: '复选框', category: '选择' },
    { value: 'checkboxGroup', label: '复选组', category: '选择' },
    { value: 'switch', label: '开关', category: '开关' },
    { value: 'rate', label: '评分', category: '其他' },
    { value: 'slider', label: '滑块', category: '其他' },
    { value: 'upload', label: '上传', category: '其他' },
    { value: 'transfer', label: '穿梭框', category: '其他' },
    { value: 'mentions', label: '提及', category: '其他' },
  ];

  // 数据源类型
  const dataSourceTypes = [
    { value: 'none', label: '无' },
    { value: 'static', label: '静态数据' },
    { value: 'api', label: '接口获取' },
  ];

  const handleAdd = () => {
    const newField = {
      name: '',
      label: '',
      type: 'input',
      required: false,
      placeholder: '',
      dataSource: {
        type: 'none',
        options: [],
        api: '',
      },
      render: '',
    };
    onChange([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const handleDelete = (index) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    onChange(newFields);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleMove = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      onChange(newFields);
      // 上移下移时不展开编辑框
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      onChange(newFields);
      // 上移下移时不展开编辑框
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    form.setFieldsValue(fields[index]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newFields = [...fields];
      newFields[editingIndex] = { ...newFields[editingIndex], ...values };
      onChange(newFields);
      // 保存成功后关闭编辑框
      setEditingIndex(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    form.resetFields();
  };

  const openCodeEditor = (mode, value, callback, title) => {
    setCodeEditorMode(mode);
    setCodeEditorValue(value || '');
    setCodeEditorCallback(callback);
    setCodeEditorTitle(title);
    setCodeEditorVisible(true);
  };

  const handleCodeEditorOk = (code) => {
    if (codeEditorCallback) {
      codeEditorCallback(code);
    }
    setCodeEditorVisible(false);
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '字段名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '标签',
      dataIndex: 'label',
      width: 120,
    },
    {
      title: '组件类型',
      dataIndex: 'type',
      width: 100,
      render: (type) => componentTypes.find(item => item.value === type)?.label || type,
    },
    {
      title: '必填',
      dataIndex: 'required',
      width: 60,
      render: (required) => required ? '是' : '否',
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
              disabled={index === fields.length - 1}
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
          添加搜索条件
        </Button>
      </div>

      <Table
        dataSource={fields}
        columns={columns}
        rowKey={(record, index) => index}
        pagination={false}
        size="small"
        bordered
      />

      {/* 弹出式编辑框 */}
      <Modal
        title={`编辑搜索条件 - ${editingIndex !== null ? fields[editingIndex]?.label || '未命名' : ''}`}
        visible={editingIndex !== null}
        onOk={handleSave}
        onCancel={handleCancel}
        width={700}
        destroyOnClose
      >
        <RemonsForm
          form={form}
          initialValues={editingIndex !== null ? fields[editingIndex] : {}}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                name="name"
                label="字段名 (name)"
                component="input"
                componentProps={{ placeholder: '例如: username' }}
                rules={[{ required: true, message: '请输入字段名' }]}
              />
            </Col>
            <Col span={12}>
              <FormItem
                name="label"
                label="标签 (label)"
                component="input"
                componentProps={{ placeholder: '例如: 用户名' }}
                rules={[{ required: true, message: '请输入标签' }]}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                name="type"
                label="组件类型"
                component="select"
                componentProps={{ 
                  placeholder: '请选择组件类型',
                  options: componentTypes.map(type => ({ value: type.value, label: `${type.label} (${type.value})` }))
                }}
                rules={[{ required: true, message: '请选择组件类型' }]}
              />
            </Col>
            <Col span={12}>
              <FormItem
                name="required"
                label="是否必填"
                component="switch"
                valuePropName="checked"
              />
            </Col>
          </Row>

          <FormItem
            name="placeholder"
            label="占位提示"
            component="input"
            componentProps={{ placeholder: '请输入占位提示文本' }}
          />

          <FormItem 
            label="数据源配置"
            name={['dataSource', 'type']}
            component="radioGroup"
            componentProps={{ 
              options: dataSourceTypes,
              optionType: 'button'
            }}
          />
          
          <RemonsForm shouldUpdate={(prev, curr) => 
            prev.dataSource?.type !== curr.dataSource?.type
          } noStyle>
            {({ getFieldValue }) => {
              const dataSourceType = getFieldValue(['dataSource', 'type']);
              
              if (dataSourceType === 'static') {
                return (
                  <div style={{ marginTop: 8 }}>
                    <Tooltip title="编辑静态选项">
                      <Button 
                        icon={<CodeOutlined />}
                        onClick={() => {
                          const options = getFieldValue(['dataSource', 'options']) || [];
                          openCodeEditor(
                            'object',
                            JSON.stringify(options, null, 2),
                            (code) => {
                              try {
                                const parsed = JSON.parse(code);
                                form.setFieldsValue({
                                  dataSource: {
                                    ...getFieldValue('dataSource'),
                                    options: parsed,
                                  },
                                });
                              } catch (e) {
                                console.error('Parse error:', e);
                              }
                            },
                            '编辑静态选项数据'
                          );
                        }}
                      >
                        编辑选项数据
                      </Button>
                    </Tooltip>
                  </div>
                );
              }
              
              if (dataSourceType === 'api') {
                return (
                  <FormItem 
                    name={['dataSource', 'api']} 
                    component="input"
                    componentProps={{ placeholder: '请输入数据接口地址' }}
                    style={{ marginTop: 8 }}
                  />
                );
              }
              
              return null;
            }}
          </RemonsForm>

          <FormItem label="自定义渲染函数">
            <Tooltip title="编辑自定义渲染函数">
              <Button 
                icon={<CodeOutlined />}
                onClick={() => {
                  const render = form.getFieldValue('render');
                  openCodeEditor(
                    'function',
                    render,
                    (code) => form.setFieldsValue({ render: code }),
                    '编辑自定义渲染函数'
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
          </FormItem>
        </RemonsForm>
      </Modal>

      <CodeEditor
        visible={codeEditorVisible}
        onCancel={() => setCodeEditorVisible(false)}
        onOk={handleCodeEditorOk}
        initialValue={codeEditorValue}
        mode={codeEditorMode}
        title={codeEditorTitle}
      />
    </div>
  );
};

export default SearchConfig;
