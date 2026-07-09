import React from 'react';
import Header from '@components/Header';
import handleContent from '../handle.md';
import Fixed from '@components/Fixed';
import CardList from '@components/CardList';
import Container from '@components/Container';
import '@assets/css/index.global.less';
import { message } from 'antd';
import { openApp } from 'methods-r';
import npmSVG from './assets/svg/npm.svg';
import githubSVG from './assets/svg/github.svg';
import noteSvg from './assets/svg/note.svg';
import toolSvg from './assets/svg/tool.svg';
import { img } from '@utils';
import isLuckeyWork from '@/utils/luckey';

export default function ListPage() {
  const list = [
    { title: '笔记', icon: img(noteSvg), url: '/note' },
    { title: 'GitHub', icon: img(githubSVG), url: 'https://github.com/liRemons', isShow: !isLuckeyWork },
    { title: 'npm', icon: img(npmSVG), url: 'https://www.npmjs.com/~remons', isShow: !isLuckeyWork },
    { title: '工具', icon: img(toolSvg), url: '/tool', hot: true },
  ].filter(item => item.isShow !== false);

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
      header={<Header name='主页' leftPath={`/${APP_NAME}/home`} handleContent={handleContent} />}
      main={<CardList list={list} itemClick={openPage} />}
    />
    <Fixed />
  </>;
}
