import React from "react";
import { List, Card, Badge } from 'antd';
import { FileTextTwoTone, FireFilled } from '@ant-design/icons'
import { HOST } from '@utils';
import classnames from 'classnames';
import style from './index.module.less';
import { IsPC } from 'methods-r';

function CardList({ list, itemClick }) {

  const renderImg = (url) => {
    return url ? <img src={`${HOST}${url}`} alt="" /> : <span className={style.icon}><FileTextTwoTone /></span>
  }

  return (
    <List
      grid={{ gutter: [16, 16], column: IsPC() ? 4 : 2 }}
      dataSource={[...list].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0))}
      renderItem={(item) => (
        <List.Item className={style.listItem}>
          <Badge.Ribbon
            text={<span className={style.hotLabel}><FireFilled /> HOT</span>}
            color="red"
            style={{ display: item.hot ? '' : 'none' }}
          >
            <div
              onClick={() => itemClick(item)}
              className={classnames('shadow', style.cardItem)}
            >
              <Card>
                <div className={style.cardInner}>
                  <div className={style.icon}>{item.icon || renderImg(item.url)}</div>
                  <div className={style.rightText}>
                    <span className={style.cardTitle}>{item.title}</span>
                    <div className={style.subTitle}>{item.subTitle}</div>
                  </div>
                </div>
              </Card>
            </div>
          </Badge.Ribbon>
        </List.Item>
      )}
    />
  );
}

export default CardList;
