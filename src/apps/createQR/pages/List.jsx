import { Form, Button, Spin, message } from 'antd';
import { useState } from 'react';
import FormItem from '@components/Form';
import Fixed from '@components/Fixed';
import '@assets/css/index.global.less';
import './qrcode.css';
import '../model/qrcode';

export default function List() {
  const [loadingText, setLoadingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const items = [
    { name: 'value', component: 'textarea', componentProps: { rows: 4 } },
  ];

  const makeCode = (value) => {
    const QRDiv = document.getElementById('QR');
    QRDiv.innerHTML = '';

    if (!value) {
      message.warning('内容不能为空');
      return;
    }
    const val = window.btoa(unescape(encodeURIComponent(value)));
    setLoading(true);
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
  };

  const onSubmit = () => {
    makeCode(form.getFieldValue('value'));
  };

  return <Spin tip={loadingText} spinning={loading} >
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
      </div>
      <div id="QR"></div>
    </div>
    <Fixed />
  </Spin>;
}
