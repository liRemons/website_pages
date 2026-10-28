import React from 'react';
import { createRoot } from 'react-dom/client';
import { message, Spin } from 'antd';
import { HOST, USER_TOKEN } from "@utils";
import { resolvePageURL } from "@utils/nav";
import { encrypt, decrypt, DES_KEY, DES_IV } from "@utils/crypto";

const TIMEOUT_MS = 60000;
const LOADING_DELAY_MS = 200; // 指定时间内返回则不显示 loading
// 轮询类行情接口不弹全屏 loading，避免定时刷新打断操作（资讯列表用自带骨架屏，同理不弹全屏）
const noLoadingURL = ['/quote/query', '/quote/global', '/news/lives'];
// 国际指数为固定参数的轮询接口，失败原因都是上游限流，由页面内的状态文案提示，不反复弹 toast
// 资讯列表失败由 NewsBoard 状态行提示，同样不弹全局 toast
const noToastURL = ['/quote/global', '/news/lives'];

let loadingCount = 0;
let loadingTimer = null; // 用于存储延迟显示 loading 的定时器

const controlLoading = ({ isOpen }) => {
  const loadingDOM = document.getElementById('loading');
  if (!loadingDOM) return; // 增加防御性编程，防止 DOM 未挂载时报错
  
  const root = createRoot(loadingDOM);
  if (isOpen) {
    loadingDOM.setAttribute('class', 'loadingVerlay');
    loadingDOM.style.display = 'flex';
    root.render(<Spin description="加载中..." size="large" />);
  } else {
    loadingDOM.setAttribute('class', '');
    loadingDOM.style.display = 'none';
    root.render('');
  }
};

const showLoading = () => {
  loadingCount += 1;
  // 如果当前已经有定时器在跑，或者 loading 已经显示，则不需要重新设置定时器
  if (loadingCount === 1 && !loadingTimer) {
    loadingTimer = setTimeout(() => {
      controlLoading({ isOpen: true });
      loadingTimer = null; // 触发后清空定时器标识
    }, LOADING_DELAY_MS);
  }
};

const hideLoading = () => {
  loadingCount -= 1;
  if (loadingCount <= 0) {
    loadingCount = 0;
    // 如果请求在 1s 内完成，此时定时器还在，直接清除，loading 不会弹出
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    } else {
      // 如果定时器已经触发（loading 已经显示），则手动关闭
      controlLoading({ isOpen: false });
    }
  }
};

// 登录、身份核验、上传 不加盐，其余接口均加盐
const noEncryptURL = ['/user/login', '/user/verifylogin'];
const isSkipEncrypt = (url) => {
  const u = (url || '').toLowerCase();
  return noEncryptURL.some((it) => u.includes(it)) || u.includes('upload');
};

// —— 入参加密：key 不变，叶子值转为字符串后加盐；对象递归；数组元素逐个递归加盐；FormData/Date 透传 ——
const deepEncrypt = (value) => {
  if (value === null || value === undefined) return value;
  // FormData/Date 不加密，整体透传
  if (value instanceof FormData || value instanceof Date) return value;
  // 数组结构：逐个元素递归加盐（含数组内对象/基本值）
  if (Array.isArray(value)) {
    return value.map((item) => deepEncrypt(item));
  }
  if (typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach((key) => {
      result[key] = deepEncrypt(value[key]);
    });
    return result;
  }
  return encrypt({ DES_KEY, DES_IV, MSG: String(value) });
};

// —— 出参解密：key 不变；对象递归；数组元素逐个递归解密；字符串叶子解密，其他类型原样 ——
const deepDecrypt = (value) => {
  if (value === null || value === undefined) return value;
  // 数组结构：逐个元素递归解密（含数组内对象/基本值）
  if (Array.isArray(value)) {
    return value.map((item) => deepDecrypt(item));
  }
  if (typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach((key) => {
      result[key] = deepDecrypt(value[key]);
    });
    return result;
  }
  if (typeof value === 'string') {
    try {
      return decrypt({ DES_KEY, DES_IV, MSG: value });
    } catch (e) {
      return value;
    }
  }
  return value;
};

/**
 * @typedef {Object} IRequestOptions 请求配置
 * @property {string} [method] 请求方法，默认 get
 * @property {string} [url] 接口路径（不含 HOST 前缀）
 * @property {Object} [data] 请求体参数（非 GET 方法时生效）
 * @property {Object} [params] query 参数
 * @property {Object} [headers] 额外请求头
 * @property {boolean} [quiet] 静默请求：不弹全屏 loading、不弹错误提示、遇到 403 也不自动跳登录页。
 *   用于「顺带确认一下登录态」这类探测请求 —— 跳不跳、怎么提示交给调用方决定，
 *   否则在公开页面探测登录态会把匿名访客直接轰去登录页
 */

/**
 * 基于原生 fetch 实现的请求封装
 * @param {IRequestOptions} options 请求配置
 * @returns {Promise<any>} 接口响应（出参 data 已按统一规则解密）
 */
const service = ({ method = 'get', url = '', data, params, headers = {}, quiet = false } = {}) => {
  const upperMethod = method.toUpperCase();

  // 登录/身份核验/上传 不加盐；其余入参（data + params）加盐。deepEncrypt 返回新对象，不修改原始入参
  const skipEncrypt = isSkipEncrypt(url);
  if (!skipEncrypt) {
    if (params && typeof params === 'object' && !(params instanceof FormData)) {
      params = deepEncrypt(params);
    }
    if (data && !(data instanceof FormData)) {
      data = deepEncrypt(data);
    }
  }

  // 拼接 query 参数
  let fullUrl = `${HOST}${url}`;
  if (params && Object.keys(params).length > 0) {
    fullUrl += '?' + new URLSearchParams(params).toString();
  }

  // 构造请求头
  const requestHeaders = { ...headers };
  const token = localStorage.getItem(USER_TOKEN);
  if (token) requestHeaders[USER_TOKEN] = token;
  // 加密标记头：服务端据此决定是否对入参解密/出参加密（仅本项目启用，避免影响管理后台等其它明文客户端）
  requestHeaders['x-encrypt'] = 'remons-des';

  // 构造请求体
  let body = undefined;
  if (data && upperMethod !== 'GET') {
    if (data instanceof FormData) {
      body = data;
      delete requestHeaders['Content-Type'];
    } else if (requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams(data).toString();
    } else {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
      body = JSON.stringify(data);
    }
  }

  // 全局 loading 控制
  const needLoading = !quiet && !noLoadingURL.includes(url);
  if (needLoading) showLoading();

  // 超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  return fetch(fullUrl, {
    method: upperMethod,
    headers: requestHeaders,
    body,
    signal: controller.signal,
  })
    .then((response) => {
      if (response.status === 403) {
        // 带上 status，调用方（如登录态校验）据此区分「服务端明确拒绝」与「网络不通」
        const err = new Error('登录状态已失效，请重新登录');
        err.status = 403;
        // quiet 请求不自己跳转，避免探测型请求把用户带离当前页面
        if (!quiet) {
          // App 环境下 window.location.origin 为 "null"，需用 resolvePageURL 改写为相对路径
          window.location.href = resolvePageURL('/login');
        }
        return Promise.reject(err);
      }
      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return response.json();
    })
    .then((res) => {
      const silent = quiet || noToastURL.some((it) => (url || '').includes(it));
      if (!res.success && !url.includes('upload') && !silent) {
        message.error(res.msg);
      }
      // 出参解密：只解业务数据 res.data，success/msg/code 保持原样
      if (!skipEncrypt && res && res.data !== undefined && res.data !== null) {
        res.data = deepDecrypt(res.data);
      }
      return res;
    })
    .catch((error) => {
      // quiet 请求的失败由调用方自行处理（例如登录态校验失败只是静默降级）
      if (quiet) return Promise.reject(error);
      // 如果是主动取消的超时请求，可以选择不弹提示或弹特定提示
      if (error.name === 'AbortError') {
        message.error('请求超时，请稍后重试');
      } else {
        message.error(error.message);
      }
      return Promise.reject(error);
    })
    .finally(() => {
      clearTimeout(timeoutId);
      if (needLoading) hideLoading();
    });
};

export { service };
export default {};