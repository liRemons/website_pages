import { service } from '@axios';

export const queryTechClassList = () => {
  return service({
    method: 'get',
    url: '/content/queryTechClassList',
    data: {},
  });
};


