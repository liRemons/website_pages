// global.d.ts
declare module '*.css' {
  const content: any;
  export default content;
}

declare module '*.less' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.md' {
  const content: string;
  export default content;
}

declare module 'methods-r';
declare module 'lodash.clonedeep';
declare module 'remons-render-markdown';
declare module 'highlight.js/lib/languages/*';

// Webpack DefinePlugin 注入的全局变量
declare const APP_NAME: string;

declare module 'markdown-it-container';