import React from 'react';
import ReactDOM from 'react-dom'
import { message, Spin } from 'antd'
import { HOST } from "@utils";

const TIMEOUT_MS = 20000;
const noLoadingURL = [];

let loadingCount = 0;

const controlLoading = ({ isOpen }) => {
  const loadingDOM = document.getElementById('loading');
  if (isOpen) {
    loadingDOM.setAttribute('class', 'loadingVerlay');
    loadingDOM.style.display = 'flex';
    ReactDOM.render(<Spin tip="加载中..." size="large"></Spin>, loadingDOM);
  } else {
    loadingDOM.setAttribute('class', '');
    loadingDOM.style.display = 'none';
    ReactDOM.render('', loadingDOM);
  }
};

const showLoading = () => {
  loadingCount += 1;
  controlLoading({ isOpen: true });
};

const hideLoading = () => {
  loadingCount -= 1;
  if (loadingCount <= 0) {
    loadingCount = 0;
    controlLoading({ isOpen: false });
  }
};

/**
 * 基于原生 fetch 实现的请求封装，替代 axios，无需额外依赖。
 * 支持与原 axios service 相同的调用方式：{ method, url, data, params, headers }
 */
const service = ({ method = 'get', url, data, params, headers = {} } = {}) => {
  const upperMethod = method.toUpperCase();

  // 拼接 query 参数（对应 axios 的 params）
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
    if (requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams(data).toString();
    } else {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
      body = JSON.stringify(data);
    }
  }

  // 全局 loading
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
      message.error(error.message);
      return Promise.reject(error);
    })
    .finally(() => {
      clearTimeout(timeoutId);
      if (needLoading) hideLoading();
    });
};

export { service }