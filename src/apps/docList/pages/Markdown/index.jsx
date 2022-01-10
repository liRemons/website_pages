import { useEffect, useState } from 'react';
import store from '../../model/store';
import { useLocalObservable, useObserver } from 'mobx-react';
import { marked } from 'marked';
import { message } from 'antd';
import hljs from 'highlight.js';
import Empty from '@components/Empty';
import { copy } from 'methods-r';
import './markdown.css';

let timer = null;

export default function Markdown(props) {
  const localStore = useLocalObservable(() => store);
  const [html, setHtml] = useState('');

  const getMarkdown = async () => {
    const { url } = props.detail || {};
    if (url) {
      try {
        await localStore.getMarkdown(url);
        marked.setOptions({
          renderer: new marked.Renderer(),
          gfm: true,
          tables: true,
          breaks: false,
          pedantic: false,
          sanitize: false,
          smartLists: true,
          smartypants: false,
          highlight: (code) => {
            return hljs.highlightAuto(code).value;
          }
        });
        setHtml(marked(localStore.markdownInfo));
        props.getAuchor([]);
        timer = setTimeout(() => {
          props.getAuchor();
          initCodeClassName();
        }, 500);
      } catch (error) {
        props.getAuchor([]);
        setHtml('');
      }
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
  }, [props.id]);

  useEffect(() => {
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return useObserver(() => <> <div className="markdown">
    {html ? <div className='markdown-html'><div dangerouslySetInnerHTML={{ __html: html }} onClick={handleClick}></div></div> : <Empty />}
  </div>
  </>);
}
