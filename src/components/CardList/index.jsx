import React from "react";
import { List, Card } from 'antd';
import { FileTextTwoTone } from '@ant-design/icons'
import { HOST } from '@utils';
import style from './index.less';

function CardList({ list, itemClick }) {
  return <List
    grid={{ gutter: 24, column: 4 }}
    dataSource={list}
    renderItem={item => (
      <List.Item onClick={() => itemClick(item)} className={classNames('shadow', style.cardItem)}>
        <Card title={item.title}>
          {
            item.icon ? <span className={style.icon} > {item.icon || <FileTextTwoTone />}</span> : <img src={`${HOST}${item.url}`} alt="" />
          }
        </Card>
      </List.Item>
    )}
  />
}

export default CardList;