import React from 'react';
import Header from '@components/Header';
import handleContent from '../../handle.md';
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
import timeSvg from './assets/svg/time.svg';
import expressSvg from './assets/svg/express.svg';
import transcoderSvg from './assets/svg/transcoder.svg';
import travelbadgeSvg from './assets/svg/travelbadge.svg';
import tableconfigSvg from './assets/svg/tableconfig.svg';
import postmarkGeneratorSvg from './assets/svg/postmarkgenerator.svg';
import simplesketchesSvg from './assets/svg/simplesketches.svg';
import productmanagSvg from './assets/svg/productmanage.svg';
import jsonviewerSvg from './assets/svg/jsonviewer.svg'
import editorSvg from './assets/svg/editor.svg';
import pagesJson from '../../../../../scripts/pages.json'
import { img } from '@utils'

const pagesJsonSubTitle = {};
pagesJson.forEach(item => {
  pagesJsonSubTitle[item.pageName] = item.subTitle
})

export default function ListPage() {
  const list = [
    { title: '取快递', icon: img(expressSvg), appName: 'express' },
    // { title: '文档', icon: img(docSvg), appName: 'tool', params: { page: 'doc' } },
    { title: '富文本编辑器', icon: img(editorSvg), appName: 'wangEditor' },
    { title: 'markdown 编辑查看器', icon: img(markdownSvg), appName: 'reMark' },
    { title: 'URL 编解码', icon: img(decodelinkSvg), appName: 'urlCoder' },
    { title: '时间计算器', icon: img(timeSvg), appName: 'timeCalculator' },
    // { title: '扫描二维码', icon: img(scanSvg), appName: 'scanqr' },
    { title: '生成二维码', icon: img(qrcodeSvg), appName: 'createQR' },
    { title: '解码', icon: img(scanSvg), appName: 'transcoderQR' },
    { title: 'JSON 解析', icon: img(jsonviewerSvg), appName: 'jsonViewer', hot: true },
    { title: '旅行勋章', icon: img(travelbadgeSvg), appName: 'travelBadge', hot: true },
    { title: '邮戳生成器', icon: img(postmarkGeneratorSvg), appName: 'postmarkGenerator', hot: true },
    { title: '简笔画生成器', icon: img(simplesketchesSvg), appName: 'simpleSketches', hot: true },
    { title: '表单引擎', icon: img(tableconfigSvg), appName: 'tableConfig', hot: true },
    { title: '图片水印', icon: img(watermarkSvg), appName: 'imgWatermark', hot: true },
    { title: '订单管理', icon: img(productmanagSvg), appName: 'productManage', hot: true },
  ].map(item => {
    return {
      ...item,
      url: `/${item.appName}`,
      subTitle: pagesJsonSubTitle[item.appName]
    }
  });

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
      header={<Header name='实用工具' handleContent={handleContent} />}
      main={<CardList list={list} itemClick={openPage} />}
    />
    <Fixed />
  </>;
}
