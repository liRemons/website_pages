import React from 'react';
import * as pako from 'pako';
import isLuckeyWork from './luckey';

export const HOST = isLuckeyWork ? 'https://luckey.work:3008' : 'https://remons.cn:3008'

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

// base91 编码/解码（比 base64 节省约 23% 体积，适合任意二进制→字符串转换）
const BASE91_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
const BASE91_DECODE_TABLE = new Uint8Array(256).fill(91);
for (let i = 0; i < 91; i++) BASE91_DECODE_TABLE[BASE91_TABLE.charCodeAt(i)] = i;

export const base91 = {
  encode(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let result = '';
    let accumulator = 0;
    let bitsInAccumulator = 0;
    for (let i = 0; i < bytes.length; i++) {
      accumulator |= bytes[i] << bitsInAccumulator;
      bitsInAccumulator += 8;
      if (bitsInAccumulator > 13) {
        let value = accumulator & 8191;
        if (value > 88) {
          accumulator >>= 13;
          bitsInAccumulator -= 13;
        } else {
          value = accumulator & 16383;
          accumulator >>= 14;
          bitsInAccumulator -= 14;
        }
        result += BASE91_TABLE[value % 91] + BASE91_TABLE[Math.floor(value / 91)];
      }
    }
    if (bitsInAccumulator) {
      result += BASE91_TABLE[accumulator % 91];
      if (bitsInAccumulator > 7 || accumulator > 90) {
        result += BASE91_TABLE[Math.floor(accumulator / 91)];
      }
    }
    return result;
  },

  decode(input) {
    const bytes = [];
    let accumulator = 0;
    let bitsInAccumulator = 0;
    let partial = -1;
    for (let i = 0; i < input.length; i++) {
      const charValue = BASE91_DECODE_TABLE[input.charCodeAt(i)];
      if (charValue === 91) continue;
      if (partial < 0) {
        partial = charValue;
      } else {
        const value = partial + charValue * 91;
        accumulator |= value << bitsInAccumulator;
        bitsInAccumulator += (value & 8191) > 88 ? 13 : 14;
        partial = -1;
        do {
          bytes.push(accumulator & 255);
          accumulator >>= 8;
          bitsInAccumulator -= 8;
        } while (bitsInAccumulator > 7);
      }
    }
    if (partial > -1) bytes.push((accumulator | partial << bitsInAccumulator) & 255);
    return new Uint8Array(bytes);
  }
};
