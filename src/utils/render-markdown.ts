import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTOC from 'markdown-it-toc-done-right';
import hljs from 'highlight.js';
import uslug from 'uslug';

type AnchorItem = {
  title: string;
  nodeTitle: string;
  href: string;
  nodeName: string;
}

function renderMarkdown(content: string) {
  let anchor: Array<AnchorItem & { children: Array<AnchorItem> }> = [];
  const uslugify = (s: any) => uslug(s);
  const MD = new markdownIt({
    langPrefix: 'language-',
    html: true,
    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlightedCode = hljs.highlight(str, { language: lang }).value;
          return highlightedCode;
        } catch (__) { }
      }
      return '';
    },
  })
    .use(markdownItAnchor, {
      permalink: true,
      permalinkBefore: false,
      permalinkSymbol: '#',
      slugify: uslugify,
    })
    .use(markdownItTOC, {
      callback: (html: string, ast: any) => {
        anchor = ast.c;
      },
    })
  const info = MD.render(content);
  const format = (data: Array<any>) => {
    return data.map((item): AnchorItem => {
      const obj = {
        href: uslugify(item.n.trim()),
        title: item.n.trim(),
        children: format(item.c),
        nodeName: `H${item.l}`,
        nodeTitle: `<h${item.l}>${item.n.trim()}</h${item.l}>`
      };
      delete item.c;
      return obj;
    });
  };

  return {
    anchor: format(anchor),
    info,
  }
}

export default renderMarkdown;
