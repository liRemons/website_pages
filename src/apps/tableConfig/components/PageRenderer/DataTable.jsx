import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Popconfirm, 
  Modal,
  Form,
  Input,
  message,
  Tag,
  Badge,
  Image,
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  PlusOutlined,
} from '@ant-design/icons';
import moment from 'moment';

/**
 * 数据表格渲染组件
 * 根据配置动态渲染表格
 */
const DataTable = ({ 
  config = {}, 
  data = [], 
  loading = false,
  pagination = {},
  onChange,
  onEdit,
  onDelete,
  onView,
  onCreate,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();

  const { 
    columns: columnConfigs = [], 
    rowKey = 'id',
    bordered = true,
    size = 'middle',
    actions = {},
  } = config;

  // 安全执行渲染函数
  const safeRender = (renderCode, value, record, index) => {
    if (!renderCode) return value;
    
    try {
      // 创建安全的执行环境
      const renderFunc = new Function('value', 'record', 'index', 'moment', 'Tag', 'Badge', 'Image', `
        try {
          return (${renderCode})(value, record, index);
        } catch (e) {
          return value;
        }
      `);
      return renderFunc(value, record, index, moment, Tag, Badge, Image);
    } catch (error) {
      console.error('Render function error:', error);
      return value;
    }
  };

  // 构建表格列
  const buildColumns = () => {
    const columns = columnConfigs.map((col, index) => ({
      ...col,
      render: col.render 
        ? (value, record, idx) => safeRender(col.render, value, record, idx)
        : undefined,
    }));

    // 添加操作列
    if (actions.showEdit || actions.showDelete || actions.showView) {
      columns.push({
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <Space size="small">
            {actions.showView && (
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => handleView(record)}
              >
                查看
              </Button>
            )}
            {actions.showEdit && (
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            {actions.showDelete && (
              <Popconfirm
                title="确定删除吗?"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      });
    }

    return columns;
  };

  // 处理编辑
  const handleEdit = (record) => {
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  // 处理查看
  const handleView = (record) => {
    setCurrentRecord(record);
    setViewModalVisible(true);
  };

  // 处理删除
  const handleDelete = (record) => {
    onDelete && onDelete(record);
  };

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onEdit && onEdit({ ...currentRecord, ...values });
      setEditModalVisible(false);
      message.success('保存成功');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 处理表格变化（分页、排序、筛选）
  const handleTableChange = (newPagination, filters, sorter) => {
    onChange && onChange(newPagination, filters, sorter);
  };

  return (
    <div className="data-table">
      {/* 工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新增
        </Button>
      </div>

      {/* 数据表格 */}
      <Table
        columns={buildColumns()}
        dataSource={data}
        rowKey={rowKey}
        bordered={bordered}
        size={size}
        loading={loading}
        pagination={{
          ...config.pagination,
          ...pagination,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      {/* 编辑弹窗 */}
      <Modal
        title="编辑"
        visible={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {columnConfigs
            .filter(col => col.dataIndex && col.dataIndex !== 'action')
            .map(col => (
              <Form.Item
                key={col.dataIndex}
                name={col.dataIndex}
                label={col.title}
              >
                <Input />
              </Form.Item>
            ))}
        </Form>
      </Modal>

      {/* 查看弹窗 */}
      <Modal
        title="查看详情"
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {currentRecord && (
          <div>
            {columnConfigs
              .filter(col => col.dataIndex && col.dataIndex !== 'action')
              .map(col => (
                <div key={col.dataIndex} style={{ marginBottom: 16 }}>
                  <div style={{ color: '#666', marginBottom: 4 }}>{col.title}</div>
                  <div style={{ fontSize: 14 }}>
                    {col.render 
                      ? safeRender(col.render, currentRecord[col.dataIndex], currentRecord, 0)
                      : currentRecord[col.dataIndex]
                    }
                  </div>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataTable;
