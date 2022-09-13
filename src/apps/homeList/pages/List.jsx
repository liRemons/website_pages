import React from 'react';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import CardList from '@components/CardList';
import Container from '@components/Container';
import '@assets/css/index.global.less';
import { message } from 'antd';
import { openApp } from 'methods-r';
import { FilePdfOutlined, ToolOutlined } from '@ant-design/icons';
import npmSVG from './assets/svg/npm.svg';
import githubSVG from './assets/svg/github.svg'

export default function ListPage() {
  const list = [
    { title: '笔记', icon: <FilePdfOutlined />, url: '/note' },
    { title: 'GitHub', icon: <img style={{ height: '120px' }} src={githubSVG} alt="" />, url: 'https://github.com/liRemons' },
    { title: 'npm', icon: <img style={{ height: '120px' }} src={npmSVG} alt="" />, url: 'https://www.npmjs.com/~remons' },
    { title: '工具', icon: <ToolOutlined /> , url: '/tool' },
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
      header={<Header name='主页'  leftPath={`/${APP_NAME}/home`} />}
      main={<CardList list={list} itemClick={openPage} />}
    />
    <Fixed />
  </>;
}
