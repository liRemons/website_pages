import { service } from '@axios';

export const queryTechClassList = (params) => {
  return service({
    method: 'get',
    url: '/content/queryTechClassList',
    params,
  });
};

export const verifyLogin = () => {
  return service({
    method: 'post',
    url: '/user/verifyLogin',
  });
};


