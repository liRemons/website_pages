import Empty from '@components/Empty';
import { Anchor } from 'antd';
import { useState, useEffect } from 'react';
import './index.global.less';

const { Link } = Anchor;
export default function MyAnchor(props) {
  const { anchor } = props;

  const Node = (__html, nodeName) => <div><span className='link_nodename'>{nodeName}</span><div style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html }} /></div>

  const renderAnchor = (arr) => {
    return <>
      {
        arr.map(item => item.children.length ?
          <Link href={'#' + item.href} key={item.href} title={Node(item.title, item.nodeName)}>
            {renderAnchor(item.children)}
          </Link> :
          <Link href={'#' + item.href} key={item.href} title={Node(item.title, item.nodeName)} />
        )
      }
    </>
  }

  return <>
    {
      anchor.length ? <Anchor getContainer={() => document.querySelector('.markdown')}>
        {
          renderAnchor(anchor)
        }
      </Anchor> : <Empty />
    }</>;
}
