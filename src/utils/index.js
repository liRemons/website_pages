import React from 'react';
import pako from 'pako';
const hostMap = {
  'http:': 'http://remons.cn:3009',
  'https:': 'https://remons.cn:3008',
}
export const HOST = hostMap[window.location.protocol]

export const img = (svg, height) => {
  return <img style={{ height: `${height || 120}px` }} src={svg} alt="" />
}

export const gzip = (value) => {
  return btoa(pako.gzip(encodeURIComponent(value), { to: 'string' }))
}

export const unGzip = (b64Data) => {
  let strData = atob(b64Data);
  const charData = strData.split('').map(function (x) {
    return x.charCodeAt(0);
  });
  const binData = new Uint8Array(charData);
  const data = pako.inflate(binData);
  strData = String.fromCharCode.apply(null, new Uint16Array(data));
  return decodeURIComponent(strData);
}
