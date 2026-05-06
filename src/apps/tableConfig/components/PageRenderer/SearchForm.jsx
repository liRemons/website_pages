import React, { useState, useEffect } from 'react';
import { Form, FormItem, SearchForm as BaseSearchForm } from 'remons-components';
import moment from 'moment';

/**
 * 搜索表单渲染组件
 * 根据配置动态渲染搜索表单
 */
const SearchForm = ({ config = {}, onSearch, onReset, loading }) => {
  const [form] = Form.useForm();
  const [dataSourceCache, setDataSourceCache] = useState({});

  const { fields = [], layout = 'inline' } = config;

  // 加载数据源
  useEffect(() => {
    const loadDataSources = async () => {
      const cache = {};

      for (const field of fields) {
        if (field.dataSource?.type === 'api' && field.dataSource?.api) {
          try {
            // 这里应该调用实际的 API，暂时使用模拟数据
            // const response = await fetch(field.dataSource.api);\n            // const data = await response.json();\n            // cache[field.name] = data;
            cache[field.name] = [];
          } catch (error) {
            console.error(`加载数据源失败: ${field.name}`, error);
            cache[field.name] = [];
          }
        } else if (field.dataSource?.type === 'static') {
          cache[field.name] = field.dataSource.options || [];
        }
      }

      setDataSourceCache(cache);
    };

    loadDataSources();
  }, [fields]);

  // 组件类型映射（支持 remons-components 所有组件）
  const componentTypeMap = {
    'input': 'input',
    'inputPassword': 'inputPassword',
    'textarea': 'textarea',
    'number': 'inputNumber',
    'inputNumber': 'inputNumber',
    'rangeInput': 'rangeInput',
    'sizeInput': 'size',
    'select': 'select',
    'treeSelect': 'treeSelect',
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

  // 生成搜索表单 items 配置
  const searchItems = fields.map(field => {
    const { type, name, label, required, placeholder, dataSource } = field;
    const component = componentTypeMap[type] || 'input';
    const componentProps = {
      placeholder: placeholder || `请输入${label}`,
    };

    // 对于 select 类型，添加 options
    if (component === 'select') {
      componentProps.options = dataSourceCache[name] || dataSource?.options || [];
    }

    const rules = required ? [{ required: true, message: `请输入${label}` }] : [];

    return {
      name,
      label,
      component,
      componentProps,
      rules,
    };
  });

  // 处理搜索
  const handleSearch = (values) => {
    // 处理日期范围
    const processedValues = { ...values };
    fields.forEach(field => {
      if (field.type === 'rangePicker' && values[field.name]) {
        const [start, end] = values[field.name];
        processedValues[`${field.name}Start`] = start ? moment(start).format('YYYY-MM-DD') : undefined;
        processedValues[`${field.name}End`] = end ? moment(end).format('YYYY-MM-DD') : undefined;
        delete processedValues[field.name];
      } else if ((field.type === 'datePicker') && values[field.name]) {
        processedValues[field.name] = moment(values[field.name]).format('YYYY-MM-DD');
      }
    });

    onSearch && onSearch(processedValues);
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    onReset && onReset();
  };

  // 使用 remons-components 的 SearchForm 渲染
  return (
    <BaseSearchForm
      form={form}
      onFinish={handleSearch}
      onReset={handleReset}
      className="search-form"
      cols={4}
      rows={2}
      style={{ marginBottom: 24 }}
    >

      {searchItems.map((item) => (
        <FormItem {...item} key={item.name} />
      ))}
    </BaseSearchForm>
  );
};

export default SearchForm;
