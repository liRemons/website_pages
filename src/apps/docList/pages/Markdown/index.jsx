import React, { useEffect, useState } from 'react';
import store from '../../model/store';
import { useLocalObservable, useObserver } from 'mobx-react';
import { message, BackTop } from 'antd';
import Empty from '@components/Empty';
import { copy } from 'methods-r';
import './markdown.global.less';
import './index.global.less';

let timer = null;

export default function Markdown(props) {
  const localStore = useLocalObservable(() => store);
  const [html, setHtml] = useState('');

  const getMarkdown = async () => {
    try {
      props.setAnchor(JSON.parse(JSON.stringify(localStore.anchor)))
      setHtml(localStore.htmlInfo);
      if (JSON.parse(JSON.stringify(localStore.anchor)).length && window.location.hash) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.setAttribute('href', window.location.hash)
          a.click();
        }, 500);
      }
      timer = setTimeout(() => {
        initCodeClassName();
      }, 200);
    } catch (error) {
      setHtml('');
    }
  };

  const handleClick = (e) => {
    if (e.target.className === 'copy') {
      const dom = document.querySelector(`.${e.target.fatherClass}`);
      if (dom) {
        copy(dom);
        message.success('复制成功');
      }
    }
  };

  const initCodeClassName = () => {
    document.querySelectorAll('.markdown-html code[class*="language-"]').forEach((item, index) => {
      const onlyId = `copy-${index}`;
      const codeType = item.className.replace('language-', '').trim();
      const dom = document.createElement('span');
      dom.innerText = codeType + ' 复制代码';
      dom.fatherClass = onlyId;
      dom.setAttribute('class', 'copy');
      item.className += ' ' + onlyId;
      item.parentNode.appendChild(dom);
    });
  };


  useEffect(() => {
    getMarkdown();
  }, [localStore.htmlInfo, props.id]);

  useEffect(() => {
    return () => {
      clearTimeout(timer);
    };
  }, []);


  return useObserver(() => <> <div className='markdown'>
    {html ? <div className='markdown-html'><div dangerouslySetInnerHTML={{ __html: html }} onClick={handleClick}></div></div> : <Empty />}
    <BackTop target={() => document.getElementsByClassName('markdown')?.[0]} />
  </div>
  </>);
}
