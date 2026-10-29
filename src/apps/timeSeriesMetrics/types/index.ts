/**
 * 行情看板的共享类型定义
 * 指数与品种共用 IQuote；上游返回结构按数据源分别声明（腾讯原始文本 / 东财代号字段 / 见闻品种对象）
 */

/** 指数清单项：key 为上游代码（腾讯代码 sh000001 / 东财 secid 100.TWII），label 为市场标签，sessionKey 指向所属交易时段 */
interface IIndexMeta {
  key: string
  label: string
  /** MARKET_SESSIONS 的键，决定卡片上的盘前/盘中/盘后标签 */
  sessionKey: string
}

/** 指数关键价格数据 */
interface IIndexStats {
  open: number
  high: number
  low: number
  preClose: number
}

/** 解析后的单条指数行情数据 */
interface IQuote {
  id: string
  name: string
  code: string
  price: number
  changePct: number
  changeAmt: number
  color: string
  isUp: boolean
  isFlat: boolean
  /** 市场标签，如「沪深」「港股」「台股」 */
  marketLabel: string
  /** 所属交易时段的键，用于盘前/盘中/盘后标签 */
  sessionKey: string
  stats: IIndexStats
  /** 判活跃用的行情时间毫秒时间戳；上游未给时间为 0，源时间固定滞后的市场（港股）用本轮响应到达时间 */
  quoteAt: number
  /** 行情时间与判活跃依据不一致时的悬停说明（港股源时间滞后约 15 分钟），仅这类品种填充 */
  timeLagNote?: string
  /** 行情来源：eastmoney / tencent / wscn，仅国际指数与品种填充，用于区分行情时间的可信度 */
  source?: string
  /** 价格小数位（仅大宗商品与外汇需要：上游按品种给出，外汇 4 位、商品 2~3 位）；缺少或非正时按 2 位 */
  precision?: number
  updateTime: string
}

/** 服务端腾讯行情接口返回结构（data 为原始行情文本） */
interface IQuoteTextResult {
  success: boolean
  msg: string
  data: string
}

/** 服务端国际指数接口返回结构（data 为行情对象数组） */
interface IGlobalQuoteResult {
  success: boolean
  msg: string
  data: IEastIndexItem[]
  /** 服务端因上游限流而回退到缓存数据时为 true */
  stale?: boolean
  /** 这批数据在服务端的取回时间（毫秒时间戳） */
  cachedAt?: number
}

/** 服务端大宗商品接口返回结构（data 为品种对象数组） */
interface ICommodityResult {
  success: boolean
  msg: string
  data: ICommodityItem[]
  /** 服务端因上游异常而回退到缓存/落盘数据时为 true */
  stale?: boolean
  /** 这批数据在服务端的取回时间（毫秒时间戳） */
  cachedAt?: number
}

/**
 * 服务端大宗商品接口返回的单条品种行情
 * 服务端已按响应回显的 fields 顺序把值数组展开成字段对象，前端不再依赖下标；
 * 但出参会走统一加密链路（叶子值 String 后再 DES 加密），解密回来全是字符串，取值必须走 toNumber
 */
interface ICommodityItem {
  code: string // 品种代码，如 XAUUSD.OTC
  name: string // 品种名称
  type: string // 品种类型：commodity / forex
  precision: string | number // 行情小数位
  last: string | number // 最新价
  change: string | number // 涨跌额
  changePct: string | number // 涨跌幅（%）
  open: string | number // 今开
  high: string | number // 最高
  low: string | number // 最低
  preClose: string | number // 昨收（由现价减涨跌额反推）
  amplitude: string | number // 振幅
  quoteAt: string | number // 行情更新毫秒时间戳，无时为 0
}

/**
 * 东方财富国际指数单条行情
 * 字段以代号为键，且经统一加解密链路后叶子值均为字符串，取值时须做数值转换
 */
interface IEastIndexItem {
  f2: string | number // 最新价
  f3: string | number // 涨跌幅（%）
  f4: string | number // 涨跌额
  f12: string // 指数代码
  f13: string | number // 市场编号
  f14: string // 指数名称
  f15: string | number // 最高价
  f16: string | number // 最低价
  f17: string | number // 今开价
  f18: string | number // 昨收价
  f124: string | number // 行情时间戳（秒）
  src?: string // 服务端标注的数据来源：eastmoney / tencent
}

/** 资讯快讯与财经日历的类型定义已随资讯模块移到 newsFlash/types */

/** 单档盘口数据 */
interface IOrderBookRow {
  key: number
  buyPrice: string
  buyVol: string
  sellPrice: string
  sellVol: string
}

/** 股票统计数据 */
interface IStockStats {
  open: number
  high: number
  low: number
  preClose: number
  volume: string
  turnover: string
  pe: string
  totalMarketCap: string
  turnoverPct: number
  lb: number
  amplitude?: number
}

/** 解析后的单只股票数据 */
interface IStockData {
  id: string
  name: string
  code: string
  price: number
  changePct: number
  changeAmt: number
  color: string
  isUp: boolean
  isFlat: boolean
  stats: IStockStats
  orderBook: IOrderBookRow[]
  updateTime: string
}

export {
  IIndexMeta,
  IIndexStats,
  IQuote,
  IQuoteTextResult,
  IGlobalQuoteResult,
  ICommodityResult,
  ICommodityItem,
  IEastIndexItem,
  IOrderBookRow,
  IStockStats,
  IStockData,
}
