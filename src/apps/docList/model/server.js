import { service } from '@axios';

export const queryArticleList = (params) => {
  return service({
    method: 'get',
    url: '/content/queryArticleList',
    params,
  });
};

export const getMarkdown = (url) => {
  return service({
    method: 'get',
    url
  });
};

export const markdownToHTML = (content) => {
  return service({
    method: 'post',
    url: '/content/markdownToHTML',
    data: {
      content,
    },
  });
};


