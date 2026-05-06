/**
 * 配置解析工具
 * 用于解析和验证 JSON 配置
 */

// 默认配置模板
export const defaultConfig = {
  // 页面基本信息
  pageConfig: {
    title: '数据列表',
    apiBaseUrl: '',
  },
  
  // 搜索条件配置
  searchConfig: {
    fields: [],
    layout: 'inline', // inline | horizontal | vertical
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  },
  
  // 表格配置
  tableConfig: {
    columns: [],
    rowKey: 'id',
    bordered: true,
    size: 'middle',
    pagination: {
      showSizeChanger: true,
      showQuickJumper: true,
      defaultPageSize: 10,
      pageSizeOptions: ['10', '20', '50', '100'],
    },
    actions: {
      showEdit: true,
      showDelete: true,
      showView: false,
      customActions: [],
    },
  },
  
  // 数据接口配置
  apiConfig: {
    list: '', // 列表接口
    create: '', // 创建接口
    update: '', // 更新接口
    delete: '', // 删除接口
    detail: '', // 详情接口
  },
};

// 支持的表单组件类型
export const supportedFieldTypes = [
  { value: 'input', label: '文本输入', component: 'Input' },
  { value: 'select', label: '下拉选择', component: 'Select' },
  { value: 'datePicker', label: '日期选择', component: 'DatePicker' },
  { value: 'rangePicker', label: '日期范围', component: 'RangePicker' },
  { value: 'number', label: '数字输入', component: 'InputNumber' },
  { value: 'textarea', label: '文本域', component: 'TextArea' },
  { value: 'checkbox', label: '复选框', component: 'Checkbox' },
  { value: 'radio', label: '单选框', component: 'Radio' },
  { value: 'switch', label: '开关', component: 'Switch' },
];

// 验证配置
export function validateConfig(config) {
  const errors = [];
  
  if (!config) {
    errors.push('配置不能为空');
    return { valid: false, errors };
  }
  
  // 验证搜索字段
  if (config.searchConfig?.fields) {
    config.searchConfig.fields.forEach((field, index) => {
      if (!field.name) {
        errors.push(`搜索字段[${index}]: name 不能为空`);
      }
      if (!field.label) {
        errors.push(`搜索字段[${index}]: label 不能为空`);
      }
      if (!field.type) {
        errors.push(`搜索字段[${index}]: 组件类型不能为空`);
      }
    });
  }
  
  // 验证表格列
  if (config.tableConfig?.columns) {
    config.tableConfig.columns.forEach((col, index) => {
      if (!col.dataIndex && !col.key) {
        errors.push(`表格列[${index}]: dataIndex 或 key 不能为空`);
      }
      if (!col.title) {
        errors.push(`表格列[${index}]: title 不能为空`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// 导出配置为 JSON
export function exportConfig(config) {
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
  }
  return JSON.stringify(config, null, 2);
}

// 导入配置
export function importConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString);
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
    }
    return config;
  } catch (error) {
    throw new Error(`配置解析失败: ${error.message}`);
  }
}

// 生成示例配置
export function generateExampleConfig() {
  return {
    pageConfig: {
      title: '用户管理',
      apiBaseUrl: '/api',
    },
    searchConfig: {
      fields: [
        {
          name: 'username',
          label: '用户名',
          type: 'input',
          required: false,
          placeholder: '请输入用户名',
        },
        {
          name: 'status',
          label: '状态',
          type: 'select',
          required: false,
          dataSource: {
            type: 'static',
            options: [
              { label: '启用', value: 'active' },
              { label: '禁用', value: 'inactive' },
            ],
          },
        },
        {
          name: 'createTime',
          label: '创建时间',
          type: 'rangePicker',
          required: false,
        },
      ],
      layout: 'inline',
    },
    tableConfig: {
      columns: [
        {
          title: '用户名',
          dataIndex: 'username',
          key: 'username',
          width: 120,
        },
        {
          title: '邮箱',
          dataIndex: 'email',
          key: 'email',
          width: 180,
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: '(value) => value === "active" ? "启用" : "禁用"',
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          key: 'createTime',
          width: 180,
        },
      ],
      rowKey: 'id',
      bordered: true,
      pagination: {
        showSizeChanger: true,
        defaultPageSize: 10,
      },
      actions: {
        showEdit: true,
        showDelete: true,
      },
    },
    apiConfig: {
      list: '/users/list',
      create: '/users/create',
      update: '/users/update',
      delete: '/users/delete',
      detail: '/users/detail',
    },
  };
}
