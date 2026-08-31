import React, { useEffect } from 'react';
import store from '../../model/store';
import { useLocalObservable, useObserver } from 'mobx-react-lite';
import nginx from 'highlight.js/lib/languages/nginx';
import python from 'highlight.js/lib/languages/python';
import RenderMarkdown, { initHighlighter, languagesCommon } from 'remons-render-markdown';
import chartConfig from '@/utils/chart-config';
import 'remons-render-markdown/dist/index.css'
import isLogin from '@/utils/isLogin';
import renderAmap, { initAmapContainers } from '@/utils/render-amap';
import renderCopyPassword,{ initCopyPasswordContainers } from '@/utils/render-copy-password';
import '../../../../utils/render-amap/index.less';
import '../../../../utils/render-copy-password/index.less';
import dayjs from 'dayjs';

initHighlighter({
  ...languagesCommon,
  python,
  nginx
});

export default function Markdown(props) {
  const localStore = useLocalObservable(() => store);
  const defaultCollapsed = !!props.defaultCollapsed;

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

    setTimeout(() => {
      initAmapContainers();
      initCopyPasswordContainers();
    }, 100)
  }, [localStore.htmlInfo, props.id]);

  return useObserver(() => <RenderMarkdown
    showBackTop
    customRenderers={[
      (md) => md.use(renderAmap),
      (md) => md.use(renderCopyPassword),
    ]}
    excludedSelectors={['.amap-container', '.copy-password-container']}
    content={localStore.markdownInfo}
    showDriverGuide={!props.isShareMode}
    isSlotMermaid
    footer={<div style={{ textAlign: 'right', marginBottom: '6px' }}>
      <span>文档更新时间：{dayjs(localStore.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
      &nbsp;&nbsp;
      {isLogin() && <a target="_blank" href={`https://manage.remons.cn/manage/content/article/?type=edit&id=${props.id}`}>编辑此页</a>}
    </div>}
    defaultCollapsed={defaultCollapsed}
    chartConfig={chartConfig}
    backTopTarget={document.querySelector('.markdown-main-content')}
  />);
}
