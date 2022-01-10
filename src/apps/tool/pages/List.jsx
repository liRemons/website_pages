import Header from '@components/Header';
import Fixed from '@components/Fixed';
import '@assets/css/index.global.less';
import style from './index.less';
import { List, Card } from 'antd';
import { HOST } from '@utils';
import { openApp } from 'methods-r';
import { ScanOutlined, QrcodeOutlined, FilePdfOutlined, EllipsisOutlined } from '@ant-design/icons';
export default function ListPage() {
  const list = [
    { title: '解码', icon: <ScanOutlined />, url: '/transcoderQR' },
    { title: '生成二维码', icon: <QrcodeOutlined />, url: '/createQR' },
    { title: '文档', icon: <FilePdfOutlined /> },
    { title: '其他', icon: <EllipsisOutlined /> },
  ];

  const openPage = (url) => {
    openApp({ url });
  };
  return <>
    <Header name='实用工具' />
    <div className={style.container}>
      <List
        grid={{ gutter: 24, column: 4 }}
        dataSource={list}
        renderItem={item => (
          <List.Item onClick={() => openPage(item.url)} className={classNames('shadow', style.cardItem)}>
            <Card title={item.title}>
              {
                item.icon ? <span className={style.icon} > {item.icon}</span> : <img src={`${HOST}${item.url}`} alt="" />
              }
            </Card>
          </List.Item>
        )}
      />
    </div>
    <Fixed />
  </>;
}
