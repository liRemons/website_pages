/**
 * 展示层纯函数
 * 数值与时间的格式化、涨跌配色、清单查找与按清单重排，不依赖任何上游返回结构
 */

import { IIndexMeta } from '../types'
import { COLOR_DOWN, COLOR_FLAT, COLOR_UP, EMPTY_TEXT } from '../constants'

/**
 * 格式化盘口价格文本为两位小数
 * @param text - 原始价格字符串
 * @returns 为空或无法解析时原样返回，否则保留两位小数
 */
function formatPriceText(text?: string): string | undefined {
  if (!text || text.trim() === '') {
    return text
  }
  const num: number = parseFloat(text)
  return Number.isNaN(num) ? text : num.toFixed(2)
}

/**
 * 数值安全转换
 * 上游字段可能为空串、占位符或加密解密后的字符串，非法值统一按 0 参与涨跌判断
 * @param value - 原始值
 * @returns 可解析的数值，非法时返回 0
 */
function toNumber(value: string | number | undefined): number {
  const num: number = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(num) ? num : 0
}

/**
 * 数值格式化，非有限数值显示占位符
 * @param value - 原始数值
 * @param digits - 保留小数位
 * @returns 格式化后的文本
 */
function fmt(value: number | undefined, digits: number = 2): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : EMPTY_TEXT
}

/**
 * 格式化时间字符串
 * 将 "20260810143025" 格式转换为 "2026-08-10 14:30:25"
 * 港股等市场的行情时间已带分隔符，直接原样返回
 * @param t - 原始时间字符串
 * @returns 格式化后的时间字符串
 */
function formatTime(t: string): string {
  if (!t || t.length < 14 || t.indexOf('-') > -1 || t.indexOf(':') > -1) {
    return t
  }

  return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)} ${t.slice(
    8,
    10
  )}:${t.slice(10, 12)}:${t.slice(12, 14)}`
}

/** 时间数字补零 */
function padTime(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

/**
 * 将秒级时间戳格式化为可读行情时间
 * @param timestamp - 秒级时间戳
 * @returns "YYYY-MM-DD HH:mm:ss"，时间戳非法时返回占位符
 */
function formatTimestamp(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return EMPTY_TEXT
  }
  const date: Date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(
    date.getDate()
  )} ${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(
    date.getSeconds()
  )}`
}

/**
 * 将毫秒时间戳格式化为时分秒
 * 用于「数据更新于 HH:mm:ss」这类只关心时刻的文案
 * @param ms - 毫秒时间戳
 * @returns "HH:mm:ss"，时间戳非法时返回占位符
 */
function formatClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return EMPTY_TEXT
  }
  const date: Date = new Date(ms)
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(
    date.getSeconds()
  )}`
}

/**
 * 快讯时间列拆行：去掉秒，按与当前时间的距离分级，保证每行时间列宽一致
 * - 今天：只有时刻行「HH:mm」
 * - 昨天：日期行「昨天」 + 时刻行
 * - 今年更早：日期行「MM-DD」 + 时刻行
 * - 跨年：日期行「YYYY-MM-DD」 + 时刻行（定宽列内自动折成两行，不外溢）
 * 日期与时刻拆成两段由调用方分行渲染，而非拼成一长串：单行宽度会随日期格式浮动，
 * 各行时间列的虚线就对不齐；now 用页面时钟而非 Date.now()，跨零点时旧条目会自动从今天变昨天
 * @param ms - 毫秒时间戳
 * @param now - 当前毫秒时间（页面时钟快照）
 * @returns {date, time}，date 为空串表示今天；时间戳非法时两者都是占位符
 */
function formatNewsTime(ms: number, now: number): { date: string; time: string } {
  if (!Number.isFinite(ms) || ms <= 0) {
    return { date: EMPTY_TEXT, time: EMPTY_TEXT }
  }
  const date: Date = new Date(ms)
  const nowDate: Date = new Date(now)
  const time: string = `${padTime(date.getHours())}:${padTime(date.getMinutes())}`
  const sameDay: boolean =
    date.getFullYear() === nowDate.getFullYear() &&
    date.getMonth() === nowDate.getMonth() &&
    date.getDate() === nowDate.getDate()
  if (sameDay) {
    return { date: '', time }
  }
  const yesterday: Date = new Date(nowDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday: boolean =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  if (isYesterday) {
    return { date: '昨天', time }
  }
  if (date.getFullYear() === nowDate.getFullYear()) {
    return { date: `${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`, time }
  }
  return { date: `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`, time }
}

/** 星期短名索引（Date.getDay() 0-6 对应 周日~周六） */
const WEEKDAY_LABELS: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 资讯列表顶部的总日期行：「M月D日 周X」
 * 条目时间列的日期已由 formatNewsTime 给出（今天/昨天/MM-DD），这里只补一个带星期的绝对日期
 * 基于页面时钟或当前视口锚点条目的时间生成，日期一变顶部跟着变（今天自然变昨天）
 * @param ms - 毫秒时间戳
 * @returns 如「10月28日 周三」，时间戳非法时返回占位符
 */
function formatNewsDate(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return EMPTY_TEXT
  }
  const date: Date = new Date(ms)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_LABELS[date.getDay()]}`
}

/**
 * 指数代码展示形式
 * 剔掉腾讯的交易所前缀（sh/sz/bj/hk），东财与港股的字母代码（HSI、TWII、GDAXI）原样展示
 * @param code - 上游返回的代码
 * @returns 用于展示的代码文本
 */
function displayCode(code: string): string {
  if (!code) {
    return EMPTY_TEXT
  }
  return code.replace(/^(s[hz]|bj|hk)/i, '').toUpperCase()
}

/**
 * 按涨跌情况计算展示颜色
 * @param changePct - 涨跌幅（%）
 * @returns 涨红、跌绿、平盘（含无数据）中性灰
 */
function colorOf(changePct: number): string {
  if (changePct > 0) {
    return COLOR_UP
  }
  return changePct < 0 ? COLOR_DOWN : COLOR_FLAT
}

/**
 * 在指数清单中查找清单项
 * @param metas - 指数清单
 * @param key - 上游代码（腾讯代码或东财 secid）
 * @returns 匹配到的清单项，未匹配返回 undefined
 */
function findMeta(metas: IIndexMeta[], key: string): IIndexMeta | undefined {
  return metas.find((item: IIndexMeta) => item.key === key)
}

/**
 * 按清单顺序重排解析结果，并丢弃清单外的数据
 * 上游返回顺序与入参顺序不保证一致，重排后卡片位置稳定
 * @param list - 解析后的行情数据
 * @param metas - 指数清单
 * @param keyOf - 取行情数据对应清单键的方法
 * @returns 与清单同序的行情数据
 */
function arrangeByMeta<T>(list: T[], metas: IIndexMeta[], keyOf: (item: T) => string): T[] {
  const map: Map<string, T> = new Map(
    list.map((item: T) => [keyOf(item), item])
  )
  return metas
    .map((meta: IIndexMeta) => map.get(meta.key))
    .filter((item: T | undefined): item is T => item !== undefined)
}

export {
  formatPriceText,
  toNumber,
  fmt,
  formatTime,
  padTime,
  formatTimestamp,
  formatClock,
  formatNewsTime,
  formatNewsDate,
  displayCode,
  colorOf,
  findMeta,
  arrangeByMeta,
}
