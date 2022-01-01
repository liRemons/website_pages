import { service } from "@axios";

export const queryTechClassList = () => {
  return service({
    method: 'get',
    url: '/content/queryTechClassList',
    data: {},
  });
};


export const getMD = (url) => {
  return service({
    method: 'get',
    url,
    data: {},
  });
}

