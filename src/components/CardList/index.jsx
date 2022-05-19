import React from "react";
import { List, Card } from 'antd';
import { FileTextTwoTone } from '@ant-design/icons'
import { HOST } from '@utils';
import style from './index.less';

function CardList({ list, itemClick }) {

  const renderImg = (url) => {
    return url ? <img src={`${HOST}${url}`} alt="" /> : <span className={style.icon}><FileTextTwoTone /></span>
  }

  return <List
    grid={{ gutter: 24, column: 4 }}
    dataSource={list}
    renderItem={item => (
      <List.Item onClick={() => itemClick(item)} className={classNames('shadow', style.cardItem)}>
        <Card title={item.title}>
          <span className={style.icon}> {item.icon || renderImg(item.url)} </span>
        </Card>
      </List.Item>
    )}
  />
}

export default CardList;
