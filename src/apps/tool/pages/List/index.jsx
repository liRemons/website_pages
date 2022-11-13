import React from 'react';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import CardList from '@components/CardList';
import Container from '@components/Container';
import '@assets/css/index.global.less';
import { message } from 'antd';
import { openApp } from 'methods-r';
import watermarkSvg from './assets/svg/watermark.svg';
import qrcodeSvg from './assets/svg/qrcode.svg';
import markdownSvg from './assets/svg/markdown.svg';
import decodelinkSvg from './assets/svg/decodelink.svg';
import docSvg from './assets/svg/doc.svg';
import scanSvg from './assets/svg/scan.svg';
import transcoderSvg from './assets/svg/transcoder.svg';
import { img } from '@utils'

export default function ListPage() {
  const list = [
    { title: '扫描二维码', icon: img(scanSvg), url: '/scanqr' },
    { title: '生成二维码', icon: img(qrcodeSvg), url: '/createQR' },
    { title: '解码', icon: img(transcoderSvg), url: '/transcoderQR' },
    { title: '文档', icon: img(docSvg), url: '/tool', params: { page: 'doc' } },
    { title: '图片水印', icon: img(watermarkSvg), url: '/imgWatermark' },
    { title: 'markdown 编辑查看器', icon: img(markdownSvg), url: '/reMark' },
    { title: 'URL 编解码', icon: img(decodelinkSvg), url: '/urlCoder' }
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
