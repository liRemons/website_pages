import React, { useState } from 'react';
import { Form, Button, message, Modal } from 'antd';
import FormItem from '@components/Form';
import Fixed from '@components/Fixed';
import Header from '@components/Header';
import Container from '@components/Container';
import ScanQr from '@components/ScanQr';
import '@assets/css/index.global.less';
import { copy } from 'methods-r';

let obj = {};
export default function List() {
  const [arr, setArr] = useState([]);
  const [qrVisible, setQrVisible] = useState(false);
  const [form] = Form.useForm();
  const items = [
    { label: '转码前', name: 'encode', component: 'textarea', componentProps: { rows: 4, allowClear: true } },
    { label: '转码后', name: 'decode', component: 'textarea', componentProps: { rows: 4 } }
  ];

  const getQrValCallback = (val) => {
    const [_, itemInfo, text] = val.split('__');
    if (itemInfo) {
      const [key, length] = itemInfo.split('_');
      if (obj.hasOwnProperty(key)) {
        return;
      }
      obj[key] = text;
      if (Object.keys(obj).length === +length) {
        let text = '';
        for (const key in obj) {
          text += obj[key]
        }
        form.setFieldValue('encode', text);
        setTimeout(() => {
          onSubmit();
          setQrVisible(false);
        }, 200);
      }
    }

  }

  const onReset = () => {
    form.resetFields();
    setArr([]);
  };

  const onSubmit = () => {
    const value = form.getFieldValue('encode');
    !arr.includes(value.trim()) && arr.push(value.trim());
    const formatValue = decodeURIComponent(escape(window.atob(unescape(arr.join('')))));
    form.setFieldsValue({
      decode: formatValue
    });
    setArr(arr);
  };

  const scanQr = () => {
    obj = {};
    setQrVisible(true)
  }

  const onCopy = () => {
    copy(document.getElementById('decode').value)
    message.success('复制成功');
  }

  return <Container
    header={<Header name='解析二维码' leftPath={`/${APP_NAME}/tool`} />}
    main={
      <div className='p-20'>
        <Form form={form}>
          {
            items.map(item => <FormItem {...item} />)
          }
        </Form>
        <div className='tc'>
          <Button type="primary" htmlType="submit" className='m-r-20' onClick={scanQr}>
            扫描
          </Button>
          <Button type="primary" htmlType="submit" className='m-r-20' onClick={onSubmit}>
            push
          </Button>
          <Button htmlType="button" onClick={onReset}>
            重置
          </Button>
          {<Button type="primary" htmlType="button" className='m-l-20' onClick={onCopy}>
            copy
          </Button>}
        </div>
        <Fixed />
        <Modal bodyStyle={{ paddingTop: '64px' }} onOk={() => setQrVisible(false)} onCancel={() => setQrVisible(false)} open={qrVisible} destroyOnClose>
          {qrVisible && <ScanQr getQrValCallback={getQrValCallback} />}
        </Modal>
      </div>
    } />
    ;
}
