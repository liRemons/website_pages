import React from 'react';
import { createRoot } from 'react-dom/client';
import { message, Spin } from 'antd';
import { HOST } from "@utils";

const TIMEOUT_MS = 20000;
const LOADING_DELAY_MS = 200; // 指定时间内返回则不显示 loading
const noLoadingURL = [];

let loadingCount = 0;
let loadingTimer = null; // 用于存储延迟显示 loading 的定时器

const controlLoading = ({ isOpen }) => {
  const loadingDOM = document.getElementById('loading');
  if (!loadingDOM) return; // 增加防御性编程，防止 DOM 未挂载时报错
  
  const root = createRoot(loadingDOM);
  if (isOpen) {
    loadingDOM.setAttribute('class', 'loadingVerlay');
    loadingDOM.style.display = 'flex';
    root.render(<Spin tip="加载中..." size="large" />);
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

/**
 * 基于原生 fetch 实现的请求封装
 */
const service = ({ method = 'get', url, data, params, headers = {} } = {}) => {
  const upperMethod = method.toUpperCase();

  // 拼接 query 参数
  let fullUrl = `${HOST}${url}`;
  if (params && Object.keys(params).length > 0) {
    fullUrl += '?' + new URLSearchParams(params).toString();
  }

  // 构造请求头
  const requestHeaders = { ...headers };
  const token = localStorage.getItem('REMONS_TOKEN');
  if (token) requestHeaders['REMONS_TOKEN'] = token;

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
  const needLoading = !noLoadingURL.includes(url);
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((res) => {
      if (!res.success && !url.includes('upload')) {
        message.error(res.msg);
      }
      return res;
    })
    .catch((error) => {
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