import { service } from "@axios";

export const queryArticleList = () => {
  return service({
    method: "get",
    url: "/content/queryArticleList",
    data: {},
  });
};


export const getMD = (url) => {
  return service({
    method: "get",
    url,
    data: {},
  });
}

