import price from '@/assets/svg/price.svg';
import time from '@/assets/svg/time.svg';
import address from '@/assets/svg/address.svg';
import password from '@/assets/svg/password.svg';
import { img } from '@utils';

export const typeToIcon = (type: string, className?: string): any => {
  if (!type) return '';
  const iconMap: { [key: string]: any } = {
    'amap': 'https://remons.cn:3008/upload/content/icon/%E9%AB%98%E5%BE%B7%E5%9C%B0%E5%9B%BE.svg',
    'redbook': 'https://remons.cn:3008/upload/content/icon/xiaohongshu.svg',
    'price': price,
    'time': time,
    'address': address,
    'password': password,
  }

  const result = iconMap[type];

  return result ? img(result, 26, className) : '';
};