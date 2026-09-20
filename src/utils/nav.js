import { openApp as openAppWeb } from 'methods-r';

/** 是否运行在 HTML5+ App 环境（模拟器 / 真机 / file:// 协议） */
export const isApp = () =>
  typeof plus !== 'undefined' || window.location.protocol === 'file:';

/**
 * 把站内路径（/note、/docList?id=x）解析为当前环境可用的 URL
 * - H5：原样返回，由服务器路由解析
 * - App：页面真实位置是 <应用根>/<页面名>/index.html，file:// 协议下 "/note"
 *   会被解析到文件系统根（file:///note），触发"请求的页面无法打开"，
 *   因此改写为相对路径 ../<页面名>/index.html
 */
export const resolvePageURL = (url, params) => {
  if (!url || /^https?:\/\//i.test(url)) return url;
  if (!isApp()) return url;
  const [pathPart, queryPart] = url.split('?');
  const search = new URLSearchParams(queryPart || '');
  if (params) {
    Object.entries(params).forEach(([k, v]) => search.set(k, v));
  }
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const name = pathPart.replace(/^\/+|\/+$/g, '');
  return `../${name}/index.html${suffix}`;
};

/** App 环境感知的页面跳转（替代 methods-r 的 openApp） */
export const openApp = ({ url, params = {}, slidePosition = 'right' }) => {
  if (!url) {
    console.error('url 错误');
    return;
  }
  if (isApp()) {
    const [pathPart] = url.split('?');
    const name = pathPart.replace(/^\/+|\/+$/g, '');
    // 调用 index-app.html 中定义的 openPage，支持动画和页面栈管理
    if (window.openPage) {
      window.openPage(name, params, slidePosition);
    } else {
      // 兜底方案
      window.location.href = resolvePageURL(url, params);
    }
    return;
  }
  openAppWeb({ url, params });
};
