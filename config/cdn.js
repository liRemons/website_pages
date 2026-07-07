const js = [
  { externalsName: 'react', url: "https://unpkg.com/react@18.3.1/umd/react.production.min.js" },
  { externalsName: 'react-dom', url: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx@6.3.2/dist/mobx.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx-react-lite@3.1.6/dist/mobxreactlite.umd.production.min.js" },
  { externalsName: 'mobx-react', url: "https://unpkg.com/mobx-react@7.3.0/dist/mobxreact.umd.production.min.js" },
  { externalsName: 'markmap-lib', url: "https://unpkg.com/d3@7.4.4/dist/d3.min.js" },
  { externalsName: 'markmap-lib', url: "https://unpkg.com/markmap-view@0.13.2/dist/index.min.js" },
  { externalsName: 'markmap-lib', url: "https://unpkg.com/markmap-lib@0.13.2/dist/browser/index.js" },
  { externalsName: ['vditor', 'vditor/dist/index.css'], url: 'https://unpkg.com/vditor@3.11.2/dist/index.min.js' }
];

const css = [
  { externalsName: ['vditor', 'vditor/dist/index.css'], url: "https://unpkg.com/vditor@3.11.2/dist/index.css", },
]

module.exports = {
  js, css
}
