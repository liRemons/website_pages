import { service } from '@axios';

export const queryArticleList = (params) => {
  return service({
    method: 'get',
    url: '/content/queryArticleList',
    params,
  });
};


