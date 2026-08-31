export const typeToIcon = (type: string): string => {
  switch (type) {
    case 'amap':
      return 'https://remons.cn:3008/upload/content/icon/%E9%AB%98%E5%BE%B7%E5%9C%B0%E5%9B%BE.svg';
    case 'redbook':
      return 'https://remons.cn:3008/upload/content/icon/xiaohongshu.svg';
    default:
      return '';
  }
};