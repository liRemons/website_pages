import { useState } from 'react';
import { Form, Button } from 'antd';
import FormItem from '@components/Form';
import '@assets/css/index.global.less'

export default function List() {
  const [arr, setArr] = useState([]);
  const [form] = Form.useForm();
  const items = [
    { label: '转码前', name: 'encode', component: 'textarea', componentProps: { rows: 4 } },
    { label: '转码后', name: 'decode', component: 'textarea', componentProps: { rows: 4 } }
  ];

  const onReset = () => {
    form.resetFields()
  }

  const onSubmit = () => {
    const value = form.getFieldValue('encode');
    !arr.includes(value.trim()) && arr.push(value.trim());
    const formatValue = unescape(arr.join(''));
    form.setFieldsValue({
      decode: formatValue
    })
    setArr(arr);
  }

  return <div className='p-20'>
    <Form form={form}>
      {
        items.map(item => <FormItem {...item} />)
      }
    </Form>
    <div className='tc'>
      <Button type="primary" htmlType="submit" className='m-r-20' onClick={onSubmit}>
        PUSH
      </Button>
      <Button htmlType="button" onClick={onReset}>
        重置
      </Button>
    </div>
  </div>;
}
