import { service } from '@axios';

export const login = (data) => {
  return service({
    method: 'post',
    url: '/user/login',
    data,
  });
};