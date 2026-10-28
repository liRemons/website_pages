/**
 * 上游行情解析
 * 把腾讯的波浪号文本、东财的代号字段、见闻的品种数组统一整成 IQuote / IStockData
 */

import { ICommodityItem, IEastIndexItem, IIndexMeta, IOrderBookRow, IQuote, IStockData } from '../types'
import { CN_HK_INDEXES, COLOR_DOWN, COLOR_FLAT, COLOR_UP, COMMODITY_PRODUCTS, GLOBAL_INDEXES, HK_SNAPSHOT_LAG_NOTE, ORDER_BOOK_LEVELS } from '../constants'
import { colorOf, findMeta, formatTime, formatTimestamp, toNumber } from './format'
import { parseBeijingCompactTime } from './market'

/**
 * 解析单行指数行情数据（沪深北与港股指数共用腾讯字段布局）
 *
 * 腾讯接口返回格式示例：
 *   v_sh000001="1~上证指数~000001~3659.54~3648.30~..."
 *   v_hkHSI="100~恒生指数~HSI~23043.220~23041.320~..."
 *
 * 字段以 ~ 分隔，[3]最新价 [4]昨收 [5]今开 [30]行情时间 [31]涨跌 [32]涨跌幅 [33]最高 [34]最低
 *
 * 港股指数单独处理：实测腾讯给港股指数的 [30] 是约 15 分钟一拍的滞后快照时间
 * （实测本地 14:15 时该字段停在 14:00 前后），按源时间判活跃会把盘中港股永远标成「已停更」；
 * 故 quoteAt 改用本轮响应到达时间（价格是实时的，能拿到就说明在更新），
 * 源时间保留在 updateTime 里展示，滞后事由由 timeLagNote 在悬停说明中带出
 *
 * @param line - 单行原始行情字符串
 * @param arrivedAt - 本轮响应到达本地的毫秒时间戳（仅港股用作判活跃时间）
 * @returns 解析后的行情数据，解析失败返回 null
 */
const parseIndexLine = (line: string, arrivedAt: number): IQuote | null => {
  // 匹配代码与行情数据部分，代码需兼容 sh/sz/bj + 数字与 hkHSI 这类字母代码
  const metaMatch: RegExpMatchArray | null = line.match(
    /v_([A-Za-z0-9_]+)="([^"]+)"/
  )
  if (!metaMatch) {
    return null
  }

  const indexKey: string = metaMatch[1] // 如 "sh000001"、"hkHSI"
  const fields: string[] = metaMatch[2].split('~')

  const price: number = toNumber(fields[3])
  const preClose: number = toNumber(fields[4])
  const open: number = toNumber(fields[5])
  const changeAmt: number = toNumber(fields[31])
  const changePct: number = toNumber(fields[32])
  const high: number = toNumber(fields[33])
  const low: number = toNumber(fields[34])
  const isUp: boolean = changePct > 0
  const isFlat: boolean = changePct === 0
  const meta: IIndexMeta | undefined = findMeta(CN_HK_INDEXES, indexKey)
  // 仅港股指数受源侧快照延迟影响，其余市场（沪深北）的行情时间实时可信
  const isHkLagged: boolean = Boolean(meta && meta.sessionKey === 'HK')

  return {
    id: indexKey,
    name: fields[1],
    code: fields[2],
    price,
    changePct,
    changeAmt,
    color: colorOf(changePct),
    isUp,
    isFlat,
    marketLabel: meta ? meta.label : '指数',
    sessionKey: meta ? meta.sessionKey : '',
    stats: { open, high, low, preClose },
    quoteAt: isHkLagged ? arrivedAt : parseBeijingCompactTime(fields[30]),
    timeLagNote: isHkLagged ? HK_SNAPSHOT_LAG_NOTE : undefined,
    updateTime: formatTime(fields[30]),
  }
}

/**
 * 解析单行股票行情数据（个股查询专用，保留交易所前缀过滤）
 *
 * 腾讯接口返回格式示例：
 *   v_sz002335="51~天山股份~002335~12.50~12.30~..."
 *
 * 字段以 ~ 分隔，各字段含义参见腾讯行情接口文档
 *
 * @param line - 单行原始行情字符串
 * @returns 解析后的股票数据对象，解析失败返回 null
 */
const parseOneStock = (line: string): IStockData | null => {
  // 正则匹配股票代码和行情数据部分
  const metaMatch: RegExpMatchArray | null = line.match(
    /v_(s[hz]\d+)="([^"]+)"/
  )
  if (!metaMatch) {
    return null
  }

  const stockCode: string = metaMatch[1] // 如 "sz002335"
  const fields: string[] = metaMatch[2].split('~')

  // 基础行情数据提取
  const name: string = fields[1]
  const code: string = fields[2]
  const price: number = parseFloat(fields[3])
  const open: number = parseFloat(fields[5])
  const high: number = parseFloat(fields[33])
  const low: number = parseFloat(fields[34])
  const preClose: number = parseFloat(fields[4])
  const changeAmt: number = parseFloat(fields[31])
  const changePct: number = parseFloat(fields[32])
  const volume: string = fields[6] // 成交量（手）
  const turnover: string = fields[37] // 成交额（元）
  const turnoverPct: number = parseFloat(fields[38]) // 换手率（%）
  const pe: string = fields[39] // 市盈率
  const totalMarketCap: string = fields[45] // 总市值
  const lb: number = parseFloat(fields[49]) // 量比
  const amplitude: number = parseFloat(fields[43]) // 振幅

  // 涨跌/平盘颜色逻辑（A股：红涨绿跌，平盘中性灰）
  const isUp: boolean = changePct > 0
  const isFlat: boolean = changePct === 0
  const color: string = isUp ? COLOR_UP : isFlat ? COLOR_FLAT : COLOR_DOWN

  // 构建五档盘口数据（买1~买5，卖1~卖5）
  const orderBookData: IOrderBookRow[] = []
  for (let i = 0; i < ORDER_BOOK_LEVELS; i++) {
    orderBookData.push({
      key: i,
      buyPrice: fields[9 + i * 2], // 买价
      buyVol: fields[10 + i * 2], // 买量
      sellPrice: fields[19 + i * 2], // 卖价
      sellVol: fields[20 + i * 2], // 卖量
    })
  }

  return {
    id: stockCode,
    name,
    code,
    price,
    changePct,
    changeAmt,
    color,
    isUp,
    isFlat,
    stats: {
      open,
      high,
      low,
      preClose,
      volume,
      turnover,
      pe,
      totalMarketCap,
      turnoverPct,
      lb,
      amplitude,
    },
    orderBook: orderBookData,
    updateTime: formatTime(fields[30]),
  }
}

/**
 * 解析东财国际指数单条行情
 * @param item - 东财返回的单条行情
 * @returns 解析后的行情数据，数据非法返回 null
 */
const parseGlobalItem = (item: IEastIndexItem): IQuote | null => {
  if (!item || !item.f12) {
    return null
  }

  const indexKey: string = `${item.f13}.${item.f12}`
  const price: number = toNumber(item.f2)
  const preClose: number = toNumber(item.f18)
  const open: number = toNumber(item.f17)
  const changeAmt: number = toNumber(item.f4)
  const changePct: number = toNumber(item.f3)
  const high: number = toNumber(item.f15)
  const low: number = toNumber(item.f16)
  const isUp: boolean = changePct > 0
  const isFlat: boolean = changePct === 0
  const meta: IIndexMeta | undefined = findMeta(GLOBAL_INDEXES, indexKey)

  return {
    id: indexKey,
    name: item.f14,
    code: item.f12,
    price,
    changePct,
    changeAmt,
    color: colorOf(changePct),
    isUp,
    isFlat,
    marketLabel: meta ? meta.label : '指数',
    sessionKey: meta ? meta.sessionKey : '',
    stats: { open, high, low, preClose },
    // 东财 f124 为秒级时间戳，直接换算成毫秒
    quoteAt: toNumber(item.f124) * 1000,
    // 来源以服务端标注为准；服务端没标的一律按东财口径处理（防呆更保守）
    source: item.src === 'tencent' ? 'tencent' : 'eastmoney',
    updateTime: formatTimestamp(toNumber(item.f124)),
  }
}

/**
 * 解析服务端大宗商品/外汇单条行情
 * 与指数共用 IQuote 结构，额外带上上游按品种给定的小数位，卡片按它格式化价格
 * 字段值统一用 toNumber 转换：这些数字经过加密链路后全是字符串，
 * 直接当 number 用会全部判非法并把卡片丢光
 * @param item - 服务端返回的单条品种行情
 * @returns 解析后的行情数据，数据非法返回 null
 */
const parseCommodityItem = (item: ICommodityItem): IQuote | null => {
  const price: number = toNumber(item && item.last)
  // 品种价格恒大于 0，以此区分“真的为 0”与“字段缺失/解密失败”
  if (!item || !item.code || !(price > 0)) {
    return null
  }
  const meta: IIndexMeta | undefined = findMeta(COMMODITY_PRODUCTS, item.code)
  const changePct: number = toNumber(item.changePct)
  const precision: number = toNumber(item.precision)
  const quoteAt: number = toNumber(item.quoteAt)
  return {
    id: item.code,
    name: item.name,
    // 卡片右上角展示剔掉 .OTC 后缀的品种代码
    code: item.code.replace(/\.OTC$/, ''),
    price,
    changePct,
    changeAmt: toNumber(item.change),
    color: colorOf(changePct),
    isUp: changePct > 0,
    isFlat: changePct === 0,
    marketLabel: meta ? meta.label : '商品',
    sessionKey: meta ? meta.sessionKey : 'OTC',
    stats: {
      open: toNumber(item.open),
      high: toNumber(item.high),
      low: toNumber(item.low),
      preClose: toNumber(item.preClose),
    },
    quoteAt,
    // 上游的回显时间就是行情推送时间，不存时区歧义，可直接驱动数据标识
    source: 'wscn',
    precision: precision > 0 ? precision : 2,
    updateTime: formatTimestamp(Math.round(quoteAt / 1000)),
  }
}

/**
 * 校验东财通道返回的行情时间是否属于各指数自己
 * 实测（2026-10-28）同一批指数的 f124 各不相同，且与各自市场的盘中/收盘时刻吻合，
 * 说明它就是各标的自己的行情时间；但上游没有文档承诺，这道防呆仍保留：
 * 若某批东财数据的时间戳完全一致（疑似服务端响应时间），统一置 0 让标识退化为「未知」，
 * 避免把所有市场误标成「更新中」；腾讯通道的行情时间已由服务端按美东时区还原，不参与此判定
 * @param list - 解析后的国际指数行情
 * @returns 处理后的行情列表
 */
function normalizeGlobalQuoteAt(list: IQuote[]): IQuote[] {
  // 只拿东财那部分做交叉判定：混进腾讯数据会让「全部相同」这个前提失真
  const eastmoneyItems: IQuote[] = list.filter(
    (item: IQuote) => item.source !== 'tencent'
  )
  if (eastmoneyItems.length < 3) {
    return list
  }
  const stamps: Set<number> = new Set(
    eastmoneyItems.map((item: IQuote) => item.quoteAt)
  )
  if (stamps.size === 1) {
    eastmoneyItems.forEach((item: IQuote) => {
      item.quoteAt = 0
    })
  }
  return list
}

export {
  parseIndexLine,
  parseOneStock,
  parseGlobalItem,
  parseCommodityItem,
  normalizeGlobalQuoteAt,
}
