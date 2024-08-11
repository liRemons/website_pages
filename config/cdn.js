const js = [
  { externalsName: 'react', url: "https://unpkg.com/react@17.0.2/umd/react.production.min.js" },
  { externalsName: 'react-dom', url: "https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js" },
  { externalsName: 'qs', url: "https://unpkg.com/qs@6.10.3/dist/qs.js" },
  { externalsName: 'axios', url: "https://unpkg.com/axios/dist/axios.min.js" },
  { externalsName: 'classnames', url: "https://unpkg.com/classnames@2.3.1/index.js" },
  { externalsName: 'mobx', url: "https://unpkg.com/mobx@6.3.2/dist/mobx.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx-react-lite@3.1.6/dist/mobxreactlite.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx-react@7.3.0/dist/mobxreact.umd.production.min.js" },
  { externalsName: ['antd', 'antd/dist/antd.css'], url: "https://unpkg.com/antd@5.20.0/dist/antd.min.js" },
  { externalsName: 'markmap-lib', url: "https://unpkg.com/d3@7.4.4/dist/d3.min.js" },
  { externalsName: 'markmap-lib', url: "https://unpkg.com/markmap-view@0.13.2/dist/index.min.js" },
  { externalsName: 'markmap-lib', url: "https://unpkg.com/markmap-lib@0.13.2/dist/browser/index.js" },
  { externalsName: ['vditor', 'vditor/dist/index.css'], url: 'https://unpkg.com/vditor@3.8.15/dist/index.min.js' }
];

const css = [
  { externalsName: ['antd', 'antd/dist/antd.css'], url: "https://unpkg.com/antd@4.24.1/dist/antd.min.css", },
  { externalsName: ['vditor', 'vditor/dist/index.css'], url: "https://unpkg.com/vditor@3.8.15/dist/index.css", },
]

module.exports = {
  js, css
}
