import React from "react";

import isLuckeyWork from "./luckey";

export const HOST = isLuckeyWork ? "https://luckey.work:3008" : "https://remons.cn:3008";

export const img = (svg, height, className) => {
  return React.createElement("img", {
    style: { height: `${height || 120}px` },
    src: svg,
    alt: "",
    className,
  });
};

export const USER_TOKEN = 'REMONS_TOKEN'

export const hasProtocolFun = url => /^https?:\/\//i.test(url)


