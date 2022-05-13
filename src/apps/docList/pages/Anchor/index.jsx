import Empty from '@components/Empty';
import { Anchor } from 'antd';
import { useState, useEffect } from 'react';
import './index.global.less';

const { Link } = Anchor;
export default function MyAnchor(props) {
  const { anchor } = props;

  const Node = (__html, nodeName) => <div><span className='link_nodename'>{nodeName}</span><div style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html }} /></div>

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
          <Link className={enCode(item.href)} href={'#' + item.href} key={item.href} title={Node(item.title, item.nodeName)}>
            {renderAnchor(item.children)}
          </Link> :
          <Link className={enCode(item.href)} href={'#' + item.href} key={item.href} title={Node(item.title, item.nodeName)} />
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
