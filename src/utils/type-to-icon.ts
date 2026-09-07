import price from '@/assets/svg/price.svg';
import time from '@/assets/svg/time.svg';
import address from '@/assets/svg/address.svg';
import amap from '@/assets/svg/amap.svg';
import ctrip from '@/assets/svg/ctrip.svg';
import meituan from '@/assets/svg/meituan.svg';
import sharecode from '@/assets/svg/sharecode.svg';
import distance from '@/assets/svg/distance.svg';
import duration from '@/assets/svg/duration.svg';
import routeplanning from '@/assets/svg/routeplanning.svg';
import { img } from '@utils';

export const typeToIcon = (type: string): any => {
  if (!type) return '';
  const iconMap: { [key: string]: any } = {
    'amap': amap,
    'redbook': 'https://remons.cn:3008/upload/content/icon/xiaohongshu.svg',
    'price': price,
    'time': time,
    'address': address,
    'ctrip': ctrip,
    'meituan': meituan,
    'sharecode': sharecode,
    'distance': distance,
    'duration': duration,
    'routePlanning': routeplanning,
  }

  const result = iconMap[type];

  return result ? img(result, 16) : '';
};