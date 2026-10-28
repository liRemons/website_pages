/**
 * 用户偏好读写
 * URL 查询参数优先、localStorage 兜底，决定初始监控股票代码与初始激活的 Tab
 */

import { getSearchParams } from 'methods-r'
import { ACTIVE_TAB_STORAGE_KEY, CODES_STORAGE_KEY, TAB_CN_HK, TAB_COMMODITY, TAB_GLOBAL, TAB_STOCK } from '../constants'

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
  if (urlTab === TAB_STOCK || urlTab === TAB_CN_HK || urlTab === TAB_GLOBAL || urlTab === TAB_COMMODITY) {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, urlTab)
    return urlTab
  }
  if (getSearchParams('codes')) {
    return TAB_STOCK
  }
  return localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) || TAB_STOCK
}

export {
  getInitialStockCodes,
  saveStockCodes,
  DEFAULT_STOCK_CODES,
  getInitialTab,
}
