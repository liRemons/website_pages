import style from './index.less';
import { openApp } from 'methods-r';
import { LeftOutlined } from '@ant-design/icons';
export default function Header(props) {
  const Home = <div className='circle' onClick={() => openApp({ url: '/homeList' })}><LeftOutlined /></div>;
  const { name, rightComponent, leftComponent } = props;
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
