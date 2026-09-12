import React, { useEffect } from 'react';
import store from '../../model/store';
import { DownOutlined } from '@ant-design/icons';
import { createRoot } from 'react-dom/client';
import { useLocalObservable, useObserver } from 'mobx-react-lite';
import nginx from 'highlight.js/lib/languages/nginx';
import python from 'highlight.js/lib/languages/python';
import RenderMarkdown, { initHighlighter, languagesCommon } from 'remons-render-markdown';
import chartConfig from '@/utils/chart-config';
import 'remons-render-markdown/dist/index.css'
import isLogin from '@/utils/isLogin';
import { registerAll, excludedSelectors } from 'remons-markdown-plugins'
import dayjs from 'dayjs';

import 'remons-markdown-plugins/style.css'

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
      // 设置锚点
      props.setAnchor(JSON.parse(JSON.stringify(localStore.anchor)))
      if (JSON.parse(JSON.stringify(localStore.anchor)).length && window.location.hash) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.setAttribute('href', window.location.hash)
          a.click();
        }, 500);
      }

      // 设置 plugin-container 标签
      setTimeout(() => {
        const containers = document.querySelectorAll('plugin-container');
        containers.forEach((container) => {
          // 已经处理过就跳过
          if (container.dataset.circleBound) return;
          container.dataset.circleBound = 'true';
          // 1. 创建 .circle 元素
          const circle = document.createElement('div');
          circle.className = 'circle';

          // 2. 插入到 container 中
          container.appendChild(circle);

          // 3. 绑定点击事件：切换收起状态
          circle.addEventListener('click', () => {
            container.classList.toggle('collapsed');
          });

          // 4. 用 React 渲染 antd icon 到 circle 节点
          const root = createRoot(circle);
          root.render(<DownOutlined />);
        });
      }, 500)

    } catch (error) {
    }
  }, [localStore.htmlInfo, props.id]);

  return useObserver(() => <RenderMarkdown
    showBackTop
    customRenderers={[
      (md) => md.use(registerAll),
    ]}
    excludedSelectors={excludedSelectors}
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
