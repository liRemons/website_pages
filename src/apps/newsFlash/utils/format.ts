/**
 * 展示层纯函数
 * 只留快讯链路要用的数值转换与时间格式化（行情那套涨跌配色、清单重排留在 timeSeriesMetrics/utils/format）
 */

import { EMPTY_TEXT } from '../constants'

/**
 * 数值安全转换
 * 上游字段可能为空串、占位符或加密解密后的字符串，非法值统一按 0 参与判断
 * @param value - 原始值
 * @returns 可解析的数值，非法时返回 0
 */
function toNumber(value: string | number | undefined): number {
  const num: number = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(num) ? num : 0
}

/** 时间数字补零 */
function padTime(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

/**
 * 快讯条目时刻：只取时分（去掉秒）
 * 日期不在条目上重复（跨零点时旧条目也不靠条目自身区分日子），
 * 统一由列表顶部状态行的「YYYY-MM-DD 周X」给出，见 formatNewsDate
 * @param ms - 毫秒时间戳
 * @returns "HH:mm"，时间戳非法时返回占位符
 */
function formatNewsClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return EMPTY_TEXT
  }
  const date: Date = new Date(ms)
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`
}

/**
 * 顶部实时时钟：时:分:秒（HH:mm:ss），配 1 秒跳拍的 LiveClock 用
 * 与条目时刻（formatNewsClock 只到分）不同：顶部要“一直在走”的观感，故带上秒
 * @param ms - 毫秒时间戳
 * @returns "HH:mm:ss"，时间戳非法时返回占位符
 */
function formatNewsTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return EMPTY_TEXT
  }
  const date: Date = new Date(ms)
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`
}

/** 星期短名索引（Date.getDay() 0-6 对应 周日~周六） */
const WEEKDAY_LABELS: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 资讯列表顶部的总日期行：「YYYY-MM-DD 周X」
 * 年月日用 - 连接（比「YYYY年M月D日」更短，窄屏下更容易与「只看重要 + 刷新」挤进同一行不折行）
 * 条目只留时刻，这里补上带年份与星期的绝对日期：整列唯一的日期线索
 * 基于页面时钟或当前视口锚点条目的时间生成，日期一变顶部跟着变（今天自然变昨天）
 * 弹窗内也用一次（标题下方的完整时间行），因为弹窗已脱离这一行
 * @param ms - 毫秒时间戳
 * @returns 如「2026-10-28 周三」，时间戳非法时返回占位符
 */
function formatNewsDate(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return EMPTY_TEXT
  }
  const date: Date = new Date(ms)
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())} ${
    WEEKDAY_LABELS[date.getDay()]
  }`
}

export { toNumber, padTime, formatNewsClock, formatNewsTime, formatNewsDate }
