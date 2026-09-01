const js = [
  { externalsName: 'react', url: "https://registry.npmmirror.com/react/18.3.1/files/umd/react.production.min.js" },
  { externalsName: 'react-dom', url: "https://registry.npmmirror.com/react-dom/18.3.1/files/umd/react-dom.production.min.js" },
  { externalsName: 'mobx-react', url: "https://registry.npmmirror.com/mobx/6.13.6/files/dist/mobx.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://registry.npmmirror.com/mobx-react/9.2.0/files/dist/mobxreact.umd.production.min.js" },
  { externalsName: 'mermaid', url: "https://registry.npmmirror.com/mermaid/11.16.0/files/dist/mermaid.min.js" },
  { externalsName: ['vditor', 'vditor/dist/index.css'], url: 'https://registry.npmmirror.com/vditor/3.11.2/files/dist/index.min.js' },
  { externalsName: 'antd', url: "https://registry.npmmirror.com/dayjs/1.11.12/files/dayjs.min.js" },
  { externalsName: 'antd', url: "https://registry.npmmirror.com/antd/5.20.0/files/dist/antd.min.js" },
  { externalsName: 'markdown-it', url: "https://registry.npmmirror.com/markdown-it/15.0.1/files/dist/browser/markdown-it.umd.min.js" },
  { externalsName: '@wangeditor/editor', url: "https://registry.npmmirror.com/@wangeditor/editor/5.1.23/files/dist/index.js" },
  { externalsName: 'highlight.js', url: "https://unpkg.com/@highlightjs/cdn-assets@11.12.0/highlight.min.js" },
];

const css = [
  { externalsName: ['vditor', 'vditor/dist/index.css'], url: "https://registry.npmmirror.com/vditor/3.11.2/files/dist/index.css", },
  { externalsName: '@wangeditor/editor/dist/css/style.css', url: "https://registry.npmmirror.com/@wangeditor/editor/5.1.23/files/dist/css/style.css", },
  { externalsName: 'highlight.js', url: "https://unpkg.com/@highlightjs/cdn-assets@11.12.0/styles/default.min.css" },
]

module.exports = {
  js, css
}
