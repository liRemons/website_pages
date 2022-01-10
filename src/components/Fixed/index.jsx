import style from './index.less';
import '@assets/css/index.global.less';
import classnames from 'classnames';
import { HomeOutlined, UserOutlined, ShareAltOutlined, ToolOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { copy, openApp } from 'methods-r';

export default function Fixed() {
  const share = () => {
    copy(location.href);
    message.success('复制当前页面链接成功');
  };

  const go = (url) => {
    openApp({ url });
  };

  const btns = [
    { icon: <HomeOutlined />, path: '/home', title: '首页' },
    { icon: <ShareAltOutlined />, path: '', title: '分享', handle: share },
    { icon: <UserOutlined />, path: '/my', title: '关于我' },
    { icon: <ToolOutlined />, path: '/tool', title: '工具' }
  ];

  return <>
    <div className={style.container}>
      {btns.map(item => <div onClick={item.handle || (() => go(item.path))} className={classnames('circle', style.circle)}>
        {item.icon}
      </div>)}
    </div>
  </>;
}
