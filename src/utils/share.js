import { message } from "antd";
import { copy } from "methods-r";

/**
 * 分享当前页面链接：复制当前 URL 到剪贴板
 * @param {string} [customUrl] - 自定义分享链接，默认当前页面 URL
 * @param {object} [extraParams] - 额外 query 参数
 */
export function sharePage(customUrl, extraParams) {
  let url = customUrl || window.location.href;

  if (extraParams) {
    const baseUrl = url.split("?")[0];
    const params = new URLSearchParams(window.location.search);
    Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    url = `${baseUrl}?${params.toString()}`;
  }

  copy(url);
  message.success("链接已复制到剪贴板");
}
