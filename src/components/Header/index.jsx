import style from './index.less';
import { openApp } from 'methods-r';
import { LeftOutlined } from '@ant-design/icons';
export default function Header(props) {
  const { name, rightComponent, leftComponent, leftPath } = props;
  const Home = <div className='circle' onClick={() => openApp({ url: `/${APP_NAME}${leftPath}` || `/${APP_NAME}/homeList` })}><LeftOutlined /></div>;
  return <>
    <div className={style.header}>
      <div className={style.left}>
        {leftComponent}
        {Home}
      </div>
      {name}
      <div>
        {rightComponent}
      </div>
    </div>
  </>;
}
