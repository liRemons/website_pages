import React, { useEffect, useState } from 'react';
import store from '../../model/store';
import { useLocalObservable, useObserver } from 'mobx-react';
import { message, BackTop } from 'antd';
import Empty from '@components/Empty';
import { copy } from 'methods-r';
import './markdown.global.less';
import './index.global.less';
import dayjs from 'dayjs';

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
      const preNode = item.parentNode;

      // 复制按钮
      const copyBtn = document.createElement('span');
      copyBtn.innerText = codeType + ' 复制代码';
      copyBtn.fatherClass = onlyId;
      copyBtn.setAttribute('class', 'copy');
      item.className += ' ' + onlyId;
      preNode.appendChild(copyBtn);

      // 收起/展开按钮（避免重复添加）
      if (!preNode.querySelector('.code-toggle')) {
        const toggleBtn = document.createElement('span');
        toggleBtn.setAttribute('class', 'code-toggle');
        toggleBtn.innerText = '收起';
        toggleBtn.addEventListener('click', () => {
          const isCollapsed = preNode.classList.contains('code-collapsed');
          if (isCollapsed) {
            preNode.classList.remove('code-collapsed');
            toggleBtn.innerText = '收起';
          } else {
            preNode.classList.add('code-collapsed');
            toggleBtn.innerText = '展开';
          }
        });
        preNode.appendChild(toggleBtn);
      }
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
    {html ? <div className='markdown-html'><div dangerouslySetInnerHTML={{ __html: html }} onClick={handleClick}></div>
      <div className="create-time">
        文档更新于 {dayjs(localStore.createTime).format('YYYY-MM-DD HH:mm:ss')}
      </div></div> : <Empty />}
    <BackTop target={() => document.getElementsByClassName('markdown')?.[0]} />
  </div>
  </>);
}
