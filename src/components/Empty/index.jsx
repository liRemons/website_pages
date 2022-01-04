import { Empty } from 'antd';
import style from './index.less'

export default function MyEmpty({ description = '暂无数据' }) {
  return <div className={style.empty_container}><Empty description={description} /></div>;
}