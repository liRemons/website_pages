import React, { useEffect } from 'react';
import store from '../../model/store';
import { useLocalObservable, useObserver } from 'mobx-react';
import RenderMarkdown from '@/components/RenderMarkdown';

export default function Markdown(props) {
  const localStore = useLocalObservable(() => store);

  useEffect(() => {
    try {
      props.setAnchor(JSON.parse(JSON.stringify(localStore.anchor)))
      if (JSON.parse(JSON.stringify(localStore.anchor)).length && window.location.hash) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.setAttribute('href', window.location.hash)
          a.click();
        }, 500);
      }
    } catch (error) {
    }
  }, [localStore.htmlInfo, props.id]);

  return useObserver(() => <RenderMarkdown
    showBackTop
    content={localStore.markdownInfo}
    createTime={localStore.createTime}
    editButton={<a target="_blank" href={`https://manage.remons.cn/manage/content/article/?type=edit&id=${props.id}`}>编辑此页</a>}
  />);
}
