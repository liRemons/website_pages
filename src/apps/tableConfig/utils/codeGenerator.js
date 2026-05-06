/**
 * 代码生成器
 * 将 JSON 配置转换为 React 组件源码
 */

// 生成 Services 文件
const generateServices = (config) => {
  const { apiConfig } = config;
  
  return `/**
 * API Services
 * 数据请求服务层
 */

const API_BASE_URL = '${apiConfig?.baseUrl || '/api'}';

// 通用请求封装
const request = async (url, options = {}) => {
  const response = await fetch(\`\${API_BASE_URL}\${url}\`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return response.json();
};

// 获取列表数据
export const fetchList = async (params) => {
  return request('${apiConfig?.list || '/list'}', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

// 获取详情
export const fetchDetail = async (id) => {
  return request(\`${apiConfig?.detail || '/detail'}/\${id}\`, {
    method: 'GET',
  });
};

// 创建数据
export const createData = async (data) => {
  return request('${apiConfig?.create || '/create'}', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 更新数据
export const updateData = async (data) => {
  return request('${apiConfig?.update || '/update'}', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 删除数据
export const deleteData = async (id) => {
  return request(\`${apiConfig?.delete || '/delete'}/\${id}\`, {
    method: 'DELETE',
  });
};
`;
};

// 生成编辑弹窗组件 - 使用 remons-components（支持更多组件类型）
const generateEditModal = (config) => {
  const { tableConfig } = config;
  const columns = tableConfig?.columns || [];
  
  const formItems = columns
    .filter(col => col.dataIndex && col.dataIndex !== 'action')
    .map(col => {
      // 根据字段类型选择组件，默认 input
      const component = col.component || 'input';
      return `      <FormItem
        name="${col.dataIndex}"
        label="${col.title}"
        component="${component}"
        componentProps={{ placeholder: '请输入${col.title}' }}
        rules={[{ required: true, message: '请输入${col.title}' }]}
      />`;
    }).join('\n');

  return `import React from 'react';
import { Modal } from 'antd';
import { Form, FormItem } from 'remons-components';

/**
 * 编辑弹窗组件
 * 使用 remons-components 简化表单开发
 * 支持组件: input, inputPassword, textarea, inputNumber, select, treeSelect, cascader,
 *           datePicker, rangePicker, timePicker, rangeTimePicker, radio, radioGroup,
 *           checkbox, checkboxGroup, switch, rate, slider, upload, transfer, mentions
 */
const EditModal = ({ 
  visible, 
  record, 
  onCancel, 
  onSuccess,
  loading = false,
}) => {
  const [form] = Form.useForm();

  // 当记录变化时，设置表单值
  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
  }, [visible, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSuccess({ ...record, ...values });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={record ? '编辑' : '新增'}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form 
        form={form} 
        layout="vertical"
        initialValues={record || {}}
      >
${formItems}
      </Form>
    </Modal>
  );
};

export default EditModal;
`;
};

// 组件类型映射（支持 remons-components 所有组件）
const componentTypeMap = {
  'input': 'input',
  'inputPassword': 'inputPassword',
  'textarea': 'textarea',
  'number': 'inputNumber',
  'inputNumber': 'inputNumber',
    'sizeInput': 'size',  'treeSelect': 'treeSelect',
  'cascader': 'cascader',
  'datePicker': 'datePicker',
  'rangePicker': 'rangePicker',
  'timePicker': 'timePicker',
  'rangeTimePicker': 'rangeTimePicker',
  'radio': 'radio',
  'radioGroup': 'radioGroup',
  'checkbox': 'checkbox',
  'checkboxGroup': 'checkboxGroup',
  'switch': 'switch',
  'rate': 'rate',
  'slider': 'slider',
  'upload': 'upload',
  'transfer': 'transfer',
  'mentions': 'mentions',
};

// 生成搜索表单组件 - 使用 remons-components 的 SearchForm (items 配置方式)
const generateSearchForm = (searchConfig) => {
  if (!searchConfig?.fields?.length) {
    return '';
  }

  const { fields } = searchConfig;
  
  // 生成 items 数组配置
  const itemsConfig = fields.map(field => {
    const { type, name, label, required, placeholder, dataSource } = field;
    const placeholderText = placeholder || `请输入${label}`;
    const component = componentTypeMap[type] || 'input';
    
    let componentProps = `{ placeholder: '${placeholderText}'`;
    
    // 对于 select 类型，添加 options
    if (component === 'select' && dataSource?.options) {
      const optionsStr = JSON.stringify(dataSource.options).replace(/"/g, "'");
      componentProps += `, options: ${optionsStr}`;
    }
    
    componentProps += ' }';

    const rules = required ? `, rules: [{ required: true, message: '请输入${label}' }]` : '';
    
    return `  { name: '${name}', label: '${label}', component: '${component}', componentProps: ${componentProps}${rules} }`;
  }).join(',\n');

  return `import React from 'react';
import { SearchForm, FormItem } from 'remons-components';

/**
 * 搜索表单组件
 * 使用 remons-components 的 SearchForm，通过 items 配置简化表单定义
 * 支持组件: input, inputPassword, textarea, inputNumber, select, treeSelect, cascader,
 *           datePicker, rangePicker, timePicker, rangeTimePicker, radio, radioGroup,
 *           checkbox, checkboxGroup, switch, rate, slider, upload, transfer, mentions
 */
const searchItems = [
${itemsConfig}
];

const MySearchForm = ({ onSearch, onReset, loading }) => {
  return (
    <SearchForm
      onSearch={onSearch}
      onReset={onReset}
      loading={loading}
      cols={3}
      rows={2}
    >
      {searchItems.map((item) => (
        <FormItem {...item} key={item.name} />
      ))}
    </SearchForm>
  );
};

export default MySearchForm;`;
};

// 生成表格列配置
const generateTableColumns = (tableConfig) => {
  const { columns = [], actions = {} } = tableConfig;
  
  const columnsCode = columns.map(col => {
    const renderCode = col.render ? `,
      render: ${col.render}` : '';
    
    return `{
      title: '${col.title}',
      dataIndex: '${col.dataIndex}',
      key: '${col.key || col.dataIndex}',
      width: ${col.width || 150},${col.fixed ? `
      fixed: '${col.fixed}',` : ''}${col.align ? `
      align: '${col.align}',` : ''}${col.ellipsis ? `
      ellipsis: true,` : ''}${col.sorter ? `
      sorter: true,` : ''}${renderCode}
    }`;
  }).join(',\n    ');

  // 操作列
  const actionColumn = (actions.showEdit || actions.showDelete || actions.showView) ? `,
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          ${actions.showView ? `<Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>` : ''}
          ${actions.showEdit ? `<Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>` : ''}
          ${actions.showDelete ? `<Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record)}>
            <Button type="text" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>` : ''}
        </Space>
      ),
    }` : '';

  return `[${columnsCode}${actionColumn}]`;
};

// 生成主页面组件（使用拆分后的组件）
const generateMainPage = (config) => {
  const { pageConfig, tableConfig, searchConfig } = config;
  const hasSearch = searchConfig?.fields?.length > 0;
  
  return `import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import SearchForm from './components/SearchForm';
import EditModal from './components/EditModal';
import { fetchList, updateData, deleteData } from './services';
import './index.less';

/**
 * ${pageConfig?.title || '数据列表'}页面
 */
const ${pageConfig?.title?.replace(/[^a-zA-Z0-9]/g, '') || 'Data'}Page = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: ${tableConfig?.pagination?.defaultPageSize || 10},
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // 加载数据
  const loadData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const result = await fetchList({
        ...searchParams,
        ...params,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      
      setData(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
      }));
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, pagination.current, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (values) => {
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData(values);
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData({});
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    loadData();
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
  };

  const handleCreate = () => {
    setCurrentRecord(null);
    setEditModalVisible(true);
  };

  const handleSave = async (values) => {
    setModalLoading(true);
    try {
      await updateData(values);
      message.success('保存成功');
      setEditModalVisible(false);
      loadData();
    } catch (error) {
      message.error('保存失败');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteData(record.id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = ${generateTableColumns(tableConfig)};

  return (
    <div className="${pageConfig?.title?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'data'}-page">
      <Card title="${pageConfig?.title || '数据列表'}">
        ${hasSearch ? `<SearchForm
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />` : ''}
        
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="${tableConfig?.rowKey || 'id'}"
          loading={loading}
          bordered={${tableConfig?.bordered !== false}}
          size="${tableConfig?.size || 'middle'}"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => \`共 \${total} 条\`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <EditModal
        visible={editModalVisible}
        record={currentRecord}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={handleSave}
        loading={modalLoading}
      />
    </div>
  );
};

export default ${pageConfig?.title?.replace(/[^a-zA-Z0-9]/g, '') || 'Data'}Page;
`;
};

// 生成样式文件
const generateStyles = (config) => {
  const { pageConfig } = config;
  const className = pageConfig?.title?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'data';
  
  return `.${className}-page {
  padding: 24px;
  
  .ant-card {
    margin-bottom: 24px;
  }
  
  .ant-form-inline {
    .ant-form-item {
      margin-bottom: 16px;
    }
  }
}
`;
};

// 生成完整的项目文件结构（拆分版本）
export const generateProjectFiles = (config) => {
  return {
    'src/pages/index.jsx': generateMainPage(config),
    'src/pages/components/SearchForm.jsx': generateSearchForm(config.searchConfig),
    'src/pages/components/EditModal.jsx': generateEditModal(config),
    'src/pages/services/index.js': generateServices(config),
    'src/pages/index.less': generateStyles(config),
    'config.json': JSON.stringify(config, null, 2),
    'README.md': `# ${config.pageConfig?.title || '数据列表页面'}

## 项目结构

\`\`\`
src/
├── pages/
│   ├── index.jsx          # 主页面组件
│   ├── index.less         # 样式文件
│   ├── components/
│   │   ├── SearchForm.jsx # 搜索表单组件（基于 remons-components）
│   │   └── EditModal.jsx  # 编辑弹窗组件（基于 remons-components）
│   └── services/
│       └── index.js       # API 服务层
└── config.json            # 配置文件
\`\`\`

## 安装依赖

\`\`\`bash
npm install antd@^5.20.0 remons-components@^2.0.8 @ant-design/icons@^5.0.0 --save
\`\`\`

## 使用说明

1. 将生成的文件复制到项目对应目录
2. 根据实际 API 地址修改 \`services/index.js\` 中的接口地址
3. 在路由中配置页面访问路径

## 组件说明

### SearchForm
基于 remons-components 的 SearchForm，特性包括：
- 内置查询/重置按钮
- 支持展开/收起功能（自动处理多行）
- 支持多列布局（cols 参数）
- 通过 items 数组配置表单字段

### EditModal
基于 remons-components 的 Form 和 FormItem，特性包括：
- 简化表单组件引用（component="input"）
- 自动处理表单验证
- 统一组件配置方式

### services
封装了所有 API 请求方法

## remons-components 支持的表单组件

### 基础输入
- \`input\` - 文本输入
- \`inputPassword\` - 密码输入
- \`textarea\` - 文本域
- \`inputNumber\` - 数字输入

### 选择组件
- \`select\` - 下拉选择
- \`treeSelect\` - 树选择
- \`cascader\` - 级联选择
- \`radio\` / \`radioGroup\` - 单选/单选组
- \`checkbox\` / \`checkboxGroup\` - 复选框/复选组

### 日期时间
- \`datePicker\` - 日期选择
- \`rangePicker\` - 日期范围
- \`timePicker\` - 时间选择
- \`rangeTimePicker\` - 时间范围

### 其他组件
- \`switch\` - 开关
- \`rate\` - 评分
- \`slider\` - 滑块
- \`upload\` - 上传
- \`transfer\` - 穿梭框
- \`mentions\` - 提及

## remons-components 优势

- **更少的代码量**：封装了 20+ 常用表单组件和搜索表单
- **更好的开发体验**：内置表单验证、布局控制、展开收起等功能
- **一致的 UI 风格**：基于 Ant Design 5.x，保持设计一致性
- **更快的开发速度**：通过配置化方式快速构建表单

## 配置说明

详见 \`config.json\`
`,
  };
};

// 生成单个文件（向后兼容）
export const generateReactCode = (config) => {
  return generateMainPage(config);
};