import React from "react";

import isLuckeyWork from "./luckey";

export const HOST = isLuckeyWork ? "https://luckey.work:3008" : "https://remons.cn:3008";

export const img = (svg, height) => {
  return React.createElement("img", {
    style: { height: `${height || 120}px` },
    src: svg,
    alt: "",
  });
};

export const USER_TOKEN = 'REMONS_TOKEN'
