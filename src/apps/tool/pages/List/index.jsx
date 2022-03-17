import Header from '@components/Header';
import Fixed from '@components/Fixed';
import '@assets/css/index.global.less';
import style from '../index.less';
import { List, Card, message } from 'antd';
import { HOST } from '@utils';
import { openApp } from 'methods-r';
import { ScanOutlined, QrcodeOutlined, FilePdfOutlined, EllipsisOutlined } from '@ant-design/icons';
import npmSVG from './assets/svg/npm.svg';
import watermark from './assets/svg/watermark.svg';

export default function ListPage() {
  const list = [
    { title: '解码', icon: <ScanOutlined />, url: '/transcoderQR' },
    { title: '生成二维码', icon: <QrcodeOutlined />, url: '/createQR' },
    { title: '文档', icon: <FilePdfOutlined />, url: '/tool', params: { page: 'doc' } },
    { title: '其他', icon: <EllipsisOutlined /> },
    { title: 'npm', icon: <img style={{ height: '120px' }} src={npmSVG} alt="" /> },
    { title: '图片水印', icon: <img style={{ height: '120px' }} src={watermark} alt="" />, url: '/imgWatermark' },
  ];

  const openPage = ({ url, params }) => {
    if(!url) {
      message.warning('开发中');
      return;
    }
    openApp({ url: `/${APP_NAME}${url}`, params });
  };
  return <>
    <div className={style.container}>
      <Header name='实用工具' />
      <div className={style.main}>
        <List
          grid={{ gutter: 24, column: 4 }}
          dataSource={list}
          renderItem={item => (
            <List.Item onClick={() => openPage(item)} className={classNames('shadow', style.cardItem)}>
              <Card title={item.title}>
                {
                  item.icon ? <span className={style.icon} > {item.icon}</span> : <img src={`${HOST}${item.url}`} alt="" />
                }
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
    <Fixed />
  </>;
}
