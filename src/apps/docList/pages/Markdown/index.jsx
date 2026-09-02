import React, { useEffect } from 'react';
import store from '../../model/store';
import { useLocalObservable, useObserver } from 'mobx-react-lite';
import nginx from 'highlight.js/lib/languages/nginx';
import python from 'highlight.js/lib/languages/python';
import RenderMarkdown, { initHighlighter, languagesCommon } from 'remons-render-markdown';
import chartConfig from '@/utils/chart-config';
import 'remons-render-markdown/dist/index.css'
import isLogin from '@/utils/isLogin';
import renderAmap from '@/components/markdown-plugins/plugins/render-amap';
import renderCopyPassword from '@/components/markdown-plugins/plugins/render-copy-password';
import renderBadge from '@/components/markdown-plugins/plugins/render-badge';
import renderLinkCard from '@/components/markdown-plugins/plugins/render-link-preview-card';
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
  }, [localStore.htmlInfo, props.id]);

  return useObserver(() => <RenderMarkdown
    showBackTop
    customRenderers={[
      (md) => md.use(renderAmap),
      (md) => md.use(renderCopyPassword),
      (md) => md.use(renderBadge),
      (md) => md.use(renderLinkCard),
    ]}
    excludedSelectors={['.amap-container', '.copy-password-container', '.badge-container', '.link-preview-card-container']}
    content={localStore.markdownInfo}
    showDriverGuide={!props.isShareMode}
    isSlotMermaid
    footer={<div style={{ textAlign: 'right', marginBottom: '6px' }}>
      <span>文档更新时间：{dayjs(localStore.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
      &nbsp;&nbsp;
      {isLogin() && <a target="_blank" href={`https://manage.remons.cn/content/article/?type=edit&id=${props.id}`}>编辑此页</a>}
    </div>}
    defaultCollapsed={defaultCollapsed}
    chartConfig={chartConfig}
    backTopTarget={document.querySelector('.markdown-main-content')}
  />);
}
