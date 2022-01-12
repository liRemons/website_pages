import { service } from '@axios';

export const queryDocList = (params) => {
  return service({
    method: 'get',
    url: '/doc/queryDocList',
    params,
  });
};
