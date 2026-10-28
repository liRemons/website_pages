import { service } from '@axios';

export const queryArticleList = (params) => {
  return service({
    method: 'get',
    url: '/content/queryArticleList',
    params,
  });
};

export const getMarkdown = (id) => {
  return service({
    method: 'get',
    url: '/content/getArticleDetail',
    params: {
      id
    }
  });
};

export const markdownToHTML = (id) => {
  return service({
    method: 'get',
    url: '/content/markdownToHTML',
    params: {
      id,
    },
  });
};


