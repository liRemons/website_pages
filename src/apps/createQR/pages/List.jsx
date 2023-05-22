
import React, { useState } from 'react';
import { Button, Spin, message, Modal, Input } from 'antd';
import { FormItem, Form } from 'remons-components';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import '@assets/css/index.global.less';
import './qrcode.css';
import '../model/qrcode';
import Pako from 'pako';
import { gzip } from '@utils';

let intTimer;

export default function List() {
  const [loadingText, setLoadingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisble] = useState(false);
  const [form] = Form.useForm();
  const [textArr, setTextArr] = useState([]);
  const [errorStr, setErrorStr] = useState('')
  const changeReplace = (val) => {
    if (val) {
      form.setFieldsValue({ count: 500, wait: 200 })
    } else {
      form.setFieldsValue({ count: 1900, wait: 100 })
    }
  }
  const items = [
    { label: '文本', name: 'value', component: 'textarea', componentProps: { rows: 4, allowClear: true } },
    { label: '单个二维码字数限制', name: 'count', component: 'inputNumber', componentProps: { min: 300, max: 1900, defaultValue: 1900, precision: 0, step: 100 } },
    { label: '生成频率(ms)', name: 'wait', component: 'inputNumber', componentProps: { min: 100, max: 2000, defaultValue: 200, precision: 0, step: 100 } },
    { label: '模式', name: 'replace', component: 'switch', componentProps: { checkedChildren: '替换', unCheckedChildren: '平铺', onChange: changeReplace } },
  ];

  const resetTimer = () => {
    clearTimeout(intTimer);
    intTimer = null;
  }

  const makeCode = (value, type) => {
    const wait = form.getFieldValue('wait') || 200;
    const count = form.getFieldValue('count');
    const replace = form.getFieldValue('replace');
    const QRDiv = document.getElementById('QR');
    const replaceQR = document.getElementById('replaceQR')
    QRDiv.innerHTML = '';
    replaceQR.innerHTML = '';

    if (!value) {
      message.warning('内容不能为空');
      return;
    }

    const val = type === 'noZip' ? value : gzip(value);
    !replace && setLoading(true);
    const length = count || 1900;
    const ceil = Math.ceil(val.length / length);
    const arr = [...new Array(ceil).keys()].map(l => l * length);
    const textArr = arr.map((item, index) => {
      return index !== arr.length - 1 ? [
        item,
        arr[index + 1]
      ] : [
        item,
        val.length
      ];
    });

    const text = textArr.map(item => val.slice(item[0], item[1]));
    setTextArr(text);
    if (!replace) {
      text.forEach((item, index) => {
        setTimeout(() => {
          setLoadingText(`正在生成二维码 ... (共 ${text.length} 个, 当前 第 ${index + 1} 个)`);
          const div = document.createElement('div');
          const icon = document.createElement('div');
          icon.className = 'qrcodeIcon';
          icon.innerHTML = index + 1;
          div.appendChild(icon);
          div.id = 'qrcode' + index;
          div.className = 'qrcode';
          QRDiv.appendChild(div);
          var qrcode = new QRCode(document.getElementById('qrcode' + index), {
            width: 330,
            height: 330,
            correctLevel: QRCode.CorrectLevel.M
          });
          qrcode.makeCode(item);
          if (index === text.length - 1) {
            setLoadingText('');
            setLoading(false);
          }
        }, wait);
      });
    } else {
      let i = 0;
      const createQr = (index) => {
        const item = text[index]
        replaceQR.innerHTML = ''
        const div = document.createElement('div');
        const icon = document.createElement('span');
        icon.innerHTML = `(共 ${text.length} 个, 当前 第 ${index + 1} 个)`;
        replaceQR.appendChild(icon);
        div.id = 'qrcode_replace';
        div.className = 'qrcode';
        replaceQR.appendChild(div);
        var qrcode = new QRCode(document.getElementById('qrcode_replace'), {
          width: 330,
          height: 330,
          correctLevel: QRCode.CorrectLevel.M
        });
        qrcode.makeCode(`__${index}_${text.length}__${item}`);
      }
      function myInterval(func, wait) {
        let interv = function () {
          func.call(null)
          intTimer = setTimeout(interv, wait)
        }
        intTimer = setTimeout(interv, wait)
      }
      if (text.length === 1) {
        createQr(0);
        return;
      }

      myInterval(() => {
        createQr(i);
        i++;
        if (i >= text.length) {
          i = 0
        }
      }, wait);
    }

  };

  const onSubmit = () => {
    makeCode(form.getFieldValue('value'));
  };

  const upload = () => {
    if (document.querySelector('.input_file_test')) {
      document.body.removeChild(document.querySelector('.input_file_test'));
    }
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('style', 'display: none');
    input.setAttribute('class', 'input_file_test');
    input.click();
    document.body.appendChild(input)
    input.onchange = (e) => {
      const file = e.target.files[0];
      const { name, type } = file;
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onloadend = (el) => {
        makeCode(`===?filename=${name}&type=${type}===${btoa(Pako.gzip(el.target.result, { to: 'string' }))}`, 'noZip')
      }
    }
  }

  const onError = () => {
    setVisble(true);
    setErrorStr('')
  }

  const changeInput = (e) => {
    setErrorStr(e.target.value);
  }

  const onOk = () => {
    const errorQR = document.getElementById('errorQR');
    errorQR.innerHTML = ''
    errorStr.split(',').forEach((el) => {
      setTimeout(() => {
        const index = +el
        const item = textArr[index - 1]
        const div = document.createElement('div');
        const icon = document.createElement('span');
        icon.innerHTML = `(共 ${textArr.length} 个, 当前 第 ${index} 个)`;
        errorQR.appendChild(icon);
        div.id = 'qrcode_error' + (index);
        div.className = 'qrcode';
        errorQR.appendChild(div);
        var qrcode = new QRCode(document.getElementById('qrcode_error' + (index)), {
          width: 330,
          height: 330,
          correctLevel: QRCode.CorrectLevel.M
        });
        qrcode.makeCode(`__${index - 1}_${textArr.length}__${item}`);
      }, 100)
    })


  }

  return <Container
    header={<Header name='创建二维码' leftPath={`/${APP_NAME}/tool`} />}
    main={<Spin tip={loadingText} spinning={loading} >
      <div className='p-20'>
        <Form labelAlign='left' layout='vertical' form={form}>
          {
            items.map(item => <FormItem {...item} />)
          }
        </Form>
        <div className='tc'>
          <Button onClick={upload} className='m-r-20'>upload</Button>
          <Button type="primary" htmlType="submit" className='m-r-20' onClick={onSubmit}>
            push
          </Button>
          <Button onClick={resetTimer} className='m-r-20'>STOP</Button>
          <Button onClick={onError}>补缺</Button>
        </div>
        <div id="QR"></div>
        <div id="replaceQR"></div>
      </div>
      <Fixed />
      <Modal destroyOnClose title='二维码补缺' open={visible} onCancel={() => setVisble(false)} onOk={onOk}>
        <div>
          <Input onChange={changeInput} placeholder='输入缺少的二维码 index，英文逗号隔开' />
          <div id="errorQR"></div>
        </div>
      </Modal>
    </Spin>} />
}

