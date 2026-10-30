import React from 'react';
import { createRoot } from 'react-dom/client';
import { message, Spin } from 'antd';
import { HOST, USER_TOKEN } from "@utils";
import { resolvePageURL } from "@utils/nav";
import { deriveSessionKey, deepEncrypt, deepDecrypt } from "@utils/sessionCrypto";

const TIMEOUT_MS = 60000;
const LOADING_DELAY_MS = 200; // 指定时间内返回则不显示 loading
// 轮询类行情接口不弹全屏 loading，避免定时刷新打断操作（资讯列表用自带骨架屏、日历指标为后台补拉，同理不弹全屏）
const noLoadingURL = ['/quote/query', '/quote/global', '/news/lives', '/news/calendar'];
// 国际指数为固定参数的轮询接口，失败原因都是上游限流，由页面内的状态文案提示，不反复弹 toast
// 资讯列表失败由 NewsBoard 状态行提示、日历指标失败静默跳过单条，同样不弹全局 toast
const noToastURL = ['/quote/global', '/news/lives', '/news/calendar'];

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

// 登录、身份核验、游客票领、上传 不走统一加解密；其余接口入参/出参逐叶子用会话密钥 AES-GCM
const noEncryptURL = ['/user/login', '/user/verifylogin', '/user/guesttoken'];
const isSkipEncrypt = (url) => {
  const u = (url || '').toLowerCase();
  return noEncryptURL.some((it) => u.includes(it)) || u.includes('upload');
};

// 游客票存于独立 key：不能占 REMONS_TOKEN，否则“token 存在 = 已登录”的各处的判断会被游客票误命中
const GUEST_TOKEN = 'REMONS_GUEST_TOKEN';
// 当前会话 token：优先真实登录票，其次游客票
const currentToken = () => localStorage.getItem(USER_TOKEN) || localStorage.getItem(GUEST_TOKEN) || '';
// 并发去重：首屏多个请求同时发时，只领一次游客票
let guestPromise = null;
const fetchGuestToken = () => {
  if (guestPromise) return guestPromise;
  guestPromise = fetch(`${HOST}/user/guestToken`, { method: 'get', headers: { 'x-enc-v': '2' } })
    .then((r) => r.json())
    .then((res) => {
      const t = res && res.data && res.data.token;
      if (!t) throw new Error('游客票获取失败');
      localStorage.setItem(GUEST_TOKEN, t);
      return t;
    })
    .finally(() => { guestPromise = null; });
  return guestPromise;
};

// 深加密/深解密已迁至 @utils/sessionCrypto（基于会话密钥 AES-256-GCM，与服务端逐字节对齐），此处直接复用。

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
const service = async ({ method = 'get', url = '', data, params, headers = {}, quiet = false } = {}) => {
  const upperMethod = method.toUpperCase();

  // 登录/身份核验/游客票/上传 不走加解密；其余接口入参(data+params)逐叶子 AES 加密
  const skipEncrypt = isSkipEncrypt(url);
  // 确保有会话 token（游客票兑底），据此派生会话密钥；白名单接口无需密钥
  let token = currentToken();
  if (!skipEncrypt && !token) token = await fetchGuestToken();
  const aesKey = token ? deriveSessionKey(token) : null;
  if (!skipEncrypt && aesKey) {
    if (params && typeof params === 'object' && !(params instanceof FormData)) {
      params = deepEncrypt(params, aesKey);
    }
    if (data && !(data instanceof FormData)) {
      data = deepEncrypt(data, aesKey);
    }
  }

  // 拼接 query 参数
  let fullUrl = `${HOST}${url}`;
  if (params && Object.keys(params).length > 0) {
    fullUrl += '?' + new URLSearchParams(params).toString();
  }

  // 构造请求头：带上会话 token（真实票优先，否则游客票）与 v2 加密标记头
  const requestHeaders = { ...headers };
  if (token) requestHeaders[USER_TOKEN] = token;
  requestHeaders['x-enc-v'] = '2';

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
      // 出参解密：只解业务数据 res.data，success/msg/code 保持原样（未拿到会话密钥时不解，明文透传）
      if (!skipEncrypt && aesKey && res && res.data !== undefined && res.data !== null) {
        res.data = deepDecrypt(res.data, aesKey);
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