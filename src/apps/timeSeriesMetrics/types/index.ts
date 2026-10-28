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

/**
 * 一条规整后的资讯快讯（前端展示用结构）
 * 服务端纯透传上游 snake_case，由 utils/news.normalizeNewsItem 转成本结构；
 * 值经加盐链路后叶子均为字符串，取数值字段须走 toNumber
 */
interface INewsItem {
  /** 上游条目 id，单调递增，用作增量去重与排序游标 */
  id: number
  title: string
  /** 纯文本正文（已去 HTML），无标题时作为主展示 */
  contentText: string
  /** 带 HTML 标签的原文 */
  contentHtml: string
  /** 展开正文（content_more）：非空表示该条可展开，展开后在下方展示 */
  contentMore: string
  /** 展示时间（毫秒时间戳） */
  displayTime: number
  uri: string
  /** 所属频道串（逗号拼接） */
  channels: string
  authorName: string
  type: string
  /** 重要度：上游 score=2 为重点快讯，前端标红 */
  score: number
  /** 配图 URL 列表，无图为空数组 */
  images: string[]
  /** 快讯关联的财经日历标识，非空表示该条带经济数据指标（需另拉今值/预期/前值） */
  calendarKey: string
  /** 日历指标类型（如 FD=财经数据），随 calendarKey 一起传给指标接口 */
  calendarType: string
  /** 关联文章（上游 article 字段），非空表示该条带原文入口，展示「相关文章」并跳转 uri */
  article: INewsArticle | null
  /** 由长连接推送刚追加进来的条目标 true，用于高亮 */
  isNew?: boolean
}

/** 快讯关联文章（上游 lives item 的 article 子对象，只取标题与跳转地址） */
interface INewsArticle {
  title: string
  uri: string
}

/**
 * 快讯关联的财经日历指标（服务端 /news/calendar 转发见闻 finance/item/key 后的规整结构）
 * 值经加盐链路后叶子均为字符串，空值（如未公布预期）为空串，展示为「--」
 */
interface INewsCalendar {
  /** 指标类别：macro / report / ipo / meeting */
  kind: string
  /** 指标标题，如「8月工业销售同比」 */
  title: string
  /** 国家/地区名 */
  country: string
  /** 国旗 icon URL */
  flagUri: string
  /** 今值（actual） */
  actual: string
  /** 预期（forecast） */
  forecast: string
  /** 前值（previous） */
  previous: string
  /** 数值单位（如 %），非空时拼在数值后面 */
  unit: string
}

/** 服务端财经日历指标接口返回结构（data 无指标时为 null） */
interface INewsCalendarResult {
  success: boolean
  msg: string
  data: INewsCalendar | null
}

/** 服务端资讯列表接口的 data（纯透传上游 lives 结构，items 为上游原始 snake_case 对象） */
interface INewsLivesPayload {
  items: Array<Record<string, unknown>>
  /** 下一页游标（上游 next_cursor，取最旧一条的时间游标） */
  next_cursor: string
  op_cursor?: string
  polling_cursor?: string
}

/** 服务端资讯列表接口返回结构 */
interface INewsLivesResult {
  success: boolean
  msg: string
  data: INewsLivesPayload
}

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
  INewsItem,
  INewsArticle,
  INewsCalendar,
  INewsCalendarResult,
  INewsLivesPayload,
  INewsLivesResult,
  IOrderBookRow,
  IStockStats,
  IStockData,
}
