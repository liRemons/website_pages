import Empty from '@components/Empty';
import { Anchor } from 'antd';
import { useState, useEffect } from 'react';
import './index.global.less';

let timer = null;

const { Link } = Anchor;
export default function MyAnchor(props) {
  const { anchor } = props;

  const Node = (item) => {
    const { nodeName, title } = item;
    return <div>
       <span className='link_nodename'>{nodeName}</span>
       <span>{title}</span>
    </div>

  }


  const enCode = (value) => {
    let str = 'a' + value.split('').map(item => item.charCodeAt(0).toString(16)).join('');
    return str
  }

  const activeAnchorToCenter = (e) => {
    if (timer) {
      clearTimeout(timer)
    }
    if (e) {
      timer = setTimeout(() => {
        document.querySelector(`.ant-anchor-wrapper .${enCode(e.replace('#', ''))}`)?.scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        })
      }, 500)
    }
  }

  const renderAnchor = (arr) => {
    return <>
      {
        arr.map(item => item.children.length ?
          <Link className={enCode(item.href)} href={'#' + item.href} key={item.href} title={Node(item)}>
            {renderAnchor(item.children)}
          </Link> :
          <Link className={enCode(item.href)} href={'#' + item.href} key={item.href} title={Node(item)} />
        )
      }
    </>
  }

  return <>
    {
      anchor.length ? <Anchor onChange={activeAnchorToCenter} getContainer={() => document.querySelector('.markdown')}>
        {
          renderAnchor(anchor)
        }
      </Anchor> : <Empty />
    }</>;
}
