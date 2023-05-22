import React, { useState } from 'react';

import { Form, Button, message, Modal, Input } from 'antd';

import FormItem from '@components/Form';

import Fixed from '@components/Fixed';

import Header from '@components/Header';

import Container from '@components/Container';

import ScanQr from '@components/ScanQr';

import { ScanOutlined, UploadOutlined, RedoOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';

import '@assets/css/index.global.less';

import { copy } from 'methods-r';

import { unGzip } from '@utils';

import Pako from 'pako'

let obj = {};

export default function List() {

  const [arr, setArr] = useState([]);

  const [visibleText, setVisibleText] = useState('扫描二维码');

  const [qrVisible, setQrVisible] = useState(false);

  const [form] = Form.useForm();

  const [exportVisible, setExportVisible] = useState(false);

  const [fileName, setFileName] = useState('');

  const [errorText, setErrorText] = useState('')

  const items = [

    { label: '转码前', name: 'encode', component: 'textarea', componentProps: { rows: 4 } },

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

      const lengthArr = Array(+length).fill().map((item, index) => index + 1)

      let a = new Set(Object.keys(obj).map(item => +item + 1));

      let b = new Set(lengthArr);

      let arr = Array.from(new Set([...b].filter(x => !a.has(x))));

      setVisibleText(`共${length}个,已扫描${Object.keys(obj).length}个，剩余${+length - Object.keys(obj).length}个`);

      arr.length >= 15 ? setErrorText(null) : setErrorText(`还剩余 ${arr.join(',')} 未扫描`)

      if (Object.keys(obj).length === +length) {

        let text = '';

        for (const key in obj) {

          text += obj[key]

        }

        form.setFieldValue('encode', text);

        setErrorText(null)

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

    const str = value.match(/===(\S*)===/)?.[1];

    !arr.includes(value.trim()) && arr.push(value.trim());

    const formatValue = str ? arr.join('') : unGzip(arr.join(''));

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

  const onDownload = () => {

    const a = document.createElement('a');

    const code = form.getFieldValue('decode');

    let file = null;

    const str = code.match(/===(\S*)===/)?.[1];

    let filename = null;

    if (str) {

      const search = new URLSearchParams(str);

      filename = search.get('filename');

      const type = search.get('type');

      const newCode = code.replace(/===(\S*)===/, '');

      const buffer = Pako.ungzip(atob(newCode));

      file = new File([buffer], filename, { type });

    } else {

      file = new File([form.getFieldValue('decode')], `${fileName}.txt`, { type: 'text/plain' });

    }

    a.href = URL.createObjectURL(file);

    a.download = str ? filename : `${fileName}.txt`

    a.click();

    setExportVisible(false);

    setFileName('')

  }

  const handleInputFileNmae = (e) => {

    setFileName(e.target.value);

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

          <Button type="primary" htmlType="submit" shape="circle" className='m-r-20' onClick={scanQr}>

            <ScanOutlined />

          </Button>

          <Button htmlType="button" shape="circle" onClick={onReset}>

            <RedoOutlined />

          </Button>

          <Button type="primary" htmlType="button" shape="circle" className='m-l-20' onClick={onCopy}>

            <CopyOutlined />

          </Button>

          <Button type="primary" htmlType="button" shape="circle" className='m-l-20' onClick={() => setExportVisible(true)}>

            <DownloadOutlined />

          </Button>

        </div>

        <Fixed />

        <Modal title={visibleText} bodyStyle={{ paddingTop: '64px' }} onOk={() => setQrVisible(false)} onCancel={() => setQrVisible(false)} open={qrVisible} destroyOnClose>

          <div>

            {qrVisible && <ScanQr getQrValCallback={getQrValCallback} />}

            {errorText}

          </div>

        </Modal>

        <Modal title='文件名设置' open={exportVisible}

          onOk={onDownload}

          onCancel={() => {

            setExportVisible(false);

            setFileNam('')

          }}>

          <Input placeholder='请输入文件名' onChange={handleInputFileNmae} />

        </Modal>

      </div>

    } />

    ;

}
       




