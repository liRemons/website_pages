const js = [
  { externalsName: 'react', url: "https://unpkg.com/react@17.0.2/umd/react.production.min.js" },
  { externalsName: 'react-dom', url: "https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js" },
  { externalsName: 'qs', url: "https://unpkg.com/qs@6.10.3/dist/qs.js" },
  { externalsName: 'axios', url: "https://unpkg.com/axios/dist/axios.min.js" },
  { externalsName: 'classnames', url: "https://unpkg.com/classnames@2.3.1/index.js" },
  { externalsName: 'mobx', url: "https://unpkg.com/mobx@6.3.2/dist/mobx.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx-react-lite@3.1.6/dist/mobxreactlite.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx-react@7.3.0/dist/mobxreact.umd.production.min.js" },
  { externalsName: 'moment', url: "https://unpkg.com/moment@2.29.1/min/moment.min.js" },
  { externalsName: 'antd', url: "https://unpkg.com/moment@2.29.1/min/moment.min.js" },
  { externalsName: 'antd', url: "https://unpkg.com/antd@4.18.9/dist/antd.min.js" },
  { externalsName: 'marked', url: "https://unpkg.com/marked@4.0.12/marked.min.js" },
  { externalsName: 'highlight.js', url: "https://unpkg.com/@highlightjs/cdn-assets@11.4.0/highlight.min.js" },
];

const css = [
  { externalsName: 'antd', url: "https://unpkg.com/antd@4.18.9/dist/antd.min.css", },
  { externalsName: 'highlight.js', url: "https://unpkg.com/@highlightjs/cdn-assets@11.4.0/styles/default.min.css", }
]

module.exports = {
  js, css
}