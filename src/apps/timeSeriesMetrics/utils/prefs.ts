/**
 * 用户偏好读写
 * URL 查询参数优先、localStorage 兜底，决定初始监控股票代码与初始激活的 Tab；
 * 切 Tab 时再把当前 Tab 写回 URL 的 tab 参数（与 docList 的 pageId 同一套做法）
 */

import { getSearchParams } from 'methods-r'
import { isApp } from '@utils/nav'
import {
  ACTIVE_TAB_STORAGE_KEY,
  CODES_STORAGE_KEY,
  TAB_CN_HK,
  TAB_COMMODITY,
  TAB_GLOBAL,
  TAB_STOCK,
} from '../constants'

/** 全部合法 Tab 标识：URL 的 tab 参数与 localStorage 的取值都要落在其中 */
const TAB_KEYS: string[] = [TAB_STOCK, TAB_CN_HK, TAB_GLOBAL, TAB_COMMODITY]

/**
 * 获取初始监控股票代码
 * 优先使用 URL 的 codes 参数（命中时回写 localStorage）；URL 无参数时读取 localStorage
 * @returns 初始股票代码字符串（逗号分隔），无则为空串
 */
function getInitialStockCodes(): string {
  const urlCodes: string = getSearchParams('codes') || ''
  if (urlCodes) {
    localStorage.setItem(CODES_STORAGE_KEY, urlCodes)
    return urlCodes
  }
  return localStorage.getItem(CODES_STORAGE_KEY) || ''
}

/** 将当前股票代码写入 localStorage（为空时清除） */
function saveStockCodes(codes: string): void {
  if (codes) {
    localStorage.setItem(CODES_STORAGE_KEY, codes)
  } else {
    localStorage.removeItem(CODES_STORAGE_KEY)
  }
}

/** 默认监控股票代码 */
const DEFAULT_STOCK_CODES: string = getInitialStockCodes()

/**
 * 获取初始激活的 Tab
 * 优先使用 URL 的 tab 参数（命中时回写 localStorage）；其次兼容原有的 ?codes= 深链，
 * 命中时直接进入个股查询；均无参数时读取 localStorage
 * @returns Tab 标识，默认个股行情查询
 */
function getInitialTab(): string {
  const urlTab: string = getSearchParams('tab') || ''
  if (TAB_KEYS.indexOf(urlTab) > -1) {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, urlTab)
    return urlTab
  }
  if (getSearchParams('codes')) {
    return TAB_STOCK
  }
  // 本地缓存同样要过白名单：旧版本/改名前的 Tab 标识如果直接返回，
  // Tabs 的 activeKey 会匹配不到任何面板，页面渲染成空白
  const savedTab: string = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) || ''
  return TAB_KEYS.indexOf(savedTab) > -1 ? savedTab : TAB_STOCK
}

/**
 * 把当前 Tab 写进 URL 的 tab 参数（其余参数如 codes 原样保留）
 * - H5：用 replaceState 而不是 pushState。切 Tab 不是页面跳转，不该在后退栈里
 *   留一串记录（docList 的条目切换用 pushState 是为了能后退回上一条，这里诉求相反）
 * - App（file:// / HTML5+）：没有可分享的地址栏，而 openApp 会重开页面栈、
 *   整个看板重新初始化，所以只在 localStorage 里记忆，不动 URL
 * @param key - 一个合法 Tab 标识
 */
function syncTabToUrl(key: string): void {
  if (isApp()) {
    return
  }
  const params: URLSearchParams = new URLSearchParams({ ...getSearchParams(), tab: key })
  history.replaceState(history.state, '', `${window.location.pathname}?${params.toString()}`)
}

/**
 * 记住当前 Tab：localStorage 供下次进页，URL 的 tab 参数供刷新/分享深链
 * @param key - 一个合法 Tab 标识
 */
function saveActiveTab(key: string): void {
  localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, key)
  syncTabToUrl(key)
}

export {
  getInitialStockCodes,
  saveStockCodes,
  DEFAULT_STOCK_CODES,
  getInitialTab,
  saveActiveTab,
}
