import React, { useEffect, useState } from 'react';
import { CopyOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { createRoot } from 'react-dom/client';
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
      timer = setTimeout(async () => {
        initCodeClassName();
        // DOM 更新完毕 1s 后渲染 Mermaid, 牺牲 cls 换取首屏加载速度
        const { default: renderMermaid } = await import('./renderMermaid');
        await renderMermaid();
      }, 10);
    } catch (error) {
      setHtml('');
    }
  };

  const initCodeClassName = () => {
    document.querySelectorAll('.markdown-html code[class*="language-"]').forEach((item, index) => {
      const onlyId = `copy-${index}`;
      const codeType = item.className.replace('language-', '').trim();
      const preNode = item.parentNode;

      const handleDOM = document.createElement('div');
      handleDOM.className = 'pre-handle';
      const code = preNode.querySelector('code');
      code.classList.add(onlyId)
      preNode.insertBefore(handleDOM, preNode.querySelector('code'));
      const codeTypeDOM = <>
        <img src="https://remons.cn:3008/upload/content/icon/code_icon.png" alt="" />
        <span>{codeType}</span>
      </>

      const copyDOM = <span className="copy" onClick={() => {
        const dom = document.querySelector(`.${onlyId}`);
        if (dom) {
          copy(dom);
          message.success('复制成功');
        }
      }}><CopyOutlined /></span>
      const root = createRoot(handleDOM)

      function CodeToggle() {
        const [isCollapsed, setIsCollapsed] = useState(false);
        return <span className="code-toggle" onClick={() => {
          setIsCollapsed(!isCollapsed);
          if (isCollapsed) {
            preNode.classList.remove('code-collapsed');
          } else {
            preNode.classList.add('code-collapsed');
          }
        }}>
          {isCollapsed ? <UpOutlined /> : <DownOutlined />}
        </span>
      }
      root.render(<>
        <span>
          {codeTypeDOM}
        </span>
        <span>
          {copyDOM}
          <CodeToggle />
        </span>
      </>)
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
    {html ? <div className='markdown-html'><div style={{ width: 100% }} dangerouslySetInnerHTML={{ __html: html }}></div>
      <div className="create-time">
        文档更新于 {dayjs(localStore.createTime).format('YYYY-MM-DD HH:mm:ss')}
      </div></div> : <Empty />}
    <BackTop target={() => document.getElementsByClassName('markdown')?.[0]} />
  </div>
  </>);
}
