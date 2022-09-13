import React from 'react';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import CardList from '@components/CardList';
import Container from '@components/Container';
import '@assets/css/index.global.less';
import { message } from 'antd';
import { openApp } from 'methods-r';
import { ScanOutlined, QrcodeOutlined, FilePdfOutlined, EllipsisOutlined, LinkOutlined } from '@ant-design/icons';
import watermark from './assets/svg/watermark.svg';
import markdown from './assets/svg/markdown.svg';

export default function ListPage() {
  const list = [
    { title: '解码', icon: <ScanOutlined />, url: '/transcoderQR' },
    { title: '生成二维码', icon: <QrcodeOutlined />, url: '/createQR' },
    { title: '文档', icon: <FilePdfOutlined />, url: '/tool', params: { page: 'doc' } },
    { title: '图片水印', icon: <img style={{ height: '120px' }} src={watermark} alt="" />, url: '/imgWatermark' },
    { title: 'markdown 编辑查看器', icon: <img style={{ height: '130px' }}  src={markdown} />, url: '/reMark' },
    { title: 'URL 编解码', icon: <LinkOutlined />, url: '/urlCoder' },
    { title: '其他', icon: <EllipsisOutlined /> },
  ];

  const openPage = ({ url, params }) => {
    if (!url) {
      message.warning('开发中');
      return;
    }
    if (url.includes('http')) {
      window.open(url);
      return;
    }
    openApp({ url: `/${APP_NAME}${url}`, params });
  };
  return <>
    <Container
      header={<Header name='实用工具' />}
      main={<CardList list={list} itemClick={openPage} />}
    />
    <Fixed />
  </>;
}
