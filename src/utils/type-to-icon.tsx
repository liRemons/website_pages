import React from "react";
import { createFromIconfontCN } from '@ant-design/icons';
import { img } from '@utils';

// ffbc03
const Icon = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_5232281_dnnrkzt4xdv.js',
});

export const typeToIcon = (type: string): any => {
  if (!type) return '';
  const iconMap: { [key: string]: any } = {
    'amap': <Icon className="markdown-icon" type="icon-amap" />,
    'redbook': <Icon className="markdown-icon" type="icon-xiaohongshu" />,
    'price': <Icon className="markdown-icon" type="icon-price" />,
    'time': <Icon className="markdown-icon" type="icon-time" />,
    'address': <Icon className="markdown-icon" type="icon-address" />,
    'ctrip': <Icon className="markdown-icon" type="icon-ctrip" />,
    'meituan': <Icon className="markdown-icon" type="icon-meituan" />,
    'sharecode': <Icon className="markdown-icon" type="icon-sharecode" />,
    'distance': <Icon className="markdown-icon" type="icon-distance" />,
    'duration': <Icon className="markdown-icon" type="icon-duration" />,
    'routePlanning': <Icon className="markdown-icon" type="icon-routeplanning" />,
    'reservation': <Icon className="markdown-icon" type="icon-reservation" />,
    'parking': <Icon className="markdown-icon" type="icon-parking" />,
    'highlightAttraction': <Icon className="markdown-icon" type="icon-highlightattraction" />,
    'travelMethod': <Icon className="markdown-icon" type="icon-travelmethod" />,
  }

  const result = iconMap[type];

  if (result && typeof result === 'string') {
    return img(result, 16);
  }

  return result || '';
};