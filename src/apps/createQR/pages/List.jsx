import React, { useState } from 'react';
import { Button, Spin, message } from 'antd';
import { FormItem, Form } from 'remons-components';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import '@assets/css/index.global.less';
import './qrcode.css';
import '../model/qrcode';

let intTimer;

export default function List() {
  const [loadingText, setLoadingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const items = [
    { label: '文本', name: 'value', component: 'textarea', componentProps: { rows: 4 } },
    { label: '模式', name: 'replace', component: 'switch', componentProps: { checkedChildren: '替换', unCheckedChildren: '平铺' } },
  ];

  const resetTimer = () => {
    // clearInterval(intTimer);
    intTimer.cancel()
  }

  const makeCode = (value) => {
    const replace = form.getFieldValue('replace');
    const QRDiv = document.getElementById('QR');
    const replaceQR = document.getElementById('replaceQR')
    QRDiv.innerHTML = '';
    replaceQR.innerHTML = '';

    if (!value) {
      message.warning('内容不能为空');
      return;
    }
    const val = window.btoa(unescape(encodeURIComponent(value)));
    !replace && setLoading(true);
    const body = document.querySelector('body');
    body.style.overflow = 'hidden';
    const length = 1900;
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
            body.style.overflow = 'auto';
          }
        }, 100);
      });
    } else {
      let i = 0;
      body.style.overflow = 'auto';
      const createQr = (index) => {
        console.log(index);
        const item = text[index]
        replaceQR.innerHTML = ''
        const div = document.createElement('div');
        const icon = document.createElement('span');
        // icon.className = 'qrcodeIcon';
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
        qrcode.makeCode(item);
      }
      function mySetInterval(fun, delay) {
        let timer = null
        function interval() {
          //fun中的同步代码执行完之后，再开始定时
          fun()
          setTimeout(interval, delay);
        }
        interval()
        return {
          cancel: () => {
            clearTimeout(timer)
          }
        }
      }

      intTimer = mySetInterval(() => {
        createQr(i);
        i++;
        if (i >= text.length) {
          i = 0
        }
      }, 1000);
    }

  };

  const onSubmit = () => {
    makeCode(form.getFieldValue('value'));
  };

  return <Container
    header={<Header name='创建二维码' leftPath={`/${APP_NAME}/tool`} />}
    main={<Spin tip={loadingText} spinning={loading} >
      <div className='p-20'>
        <Form form={form}>
          {
            items.map(item => <FormItem {...item} />)
          }
        </Form>
        <div className='tc'>
          <Button type="primary" htmlType="submit" className='m-r-20' onClick={onSubmit}>
            PUSH
          </Button>
          <Button onClick={resetTimer}>STOP</Button>
        </div>
        <div id="QR"></div>
        <div id="replaceQR"></div>
      </div>
      <Fixed />
    </Spin>} />
}
