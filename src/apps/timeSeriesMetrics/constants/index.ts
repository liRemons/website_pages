/**
 * 行情看板的常量与固定清单
 * 包含配色字号、Tab 与存储键、刷新间隔、接口地址、港股源时间滞后说明、各市场交易时段表，以及沪深港/国际/大宗商品三份指数品种清单
 */

import { IIndexMeta } from '../types'
import { ISessionSpec } from '../utils/market'

/** A股红涨绿跌配色（全站指数沿用该习惯，不区分欧美市场惯例） */
const COLOR_UP = '#cf1322'
const COLOR_DOWN = '#3f8600'
/** 平盘（不涨不跌）与无数据时的中性配色 */
const COLOR_FLAT = '#8c8c8c'

/** 数值缺失时的占位符 */
const EMPTY_TEXT = '-'

/**
 * 指数卡片字号
 * 指数点位普遍是五位以上整数（如 46747.16、64067.10），沿用个股的大字号会撑开换行，
 * 因此指数卡片的最新价与涨跌幅均比个股小一档
 */
const INDEX_PRICE_FONT_SIZE = 20
const INDEX_CHANGE_FONT_SIZE = 14

/** 五档盘口档位数 */
const ORDER_BOOK_LEVELS = 5

/** 监控股票代码的 localStorage 键 */
const CODES_STORAGE_KEY = 'tsm_stock_codes'

/** 个股行情查询 Tab 标识 */
const TAB_STOCK = 'stock'
/** 沪深港行情 Tab 标识 */
const TAB_CN_HK = 'cnhk'
/** 其他市场行情 Tab 标识 */
const TAB_GLOBAL = 'global'
/** 大宗商品 Tab 标识 */
const TAB_COMMODITY = 'commodity'

/** 记忆当前 Tab 的 localStorage 键 */
const ACTIVE_TAB_STORAGE_KEY = 'tsm_active_tab'

/** 沪深港行情刷新间隔（毫秒），盘中使用 */
const CN_HK_REFRESH_MS = 10 * 1000
/**
 * 国际行情刷新间隔（毫秒），欧美市场时区不同，不做收盘判断
 * 上游东财按 IP 限流（并发与频率都会触发熔断），60 秒比 30 秒少一半连接数；
 * 这些市场本身非实时且跨时区多数处于收盘时段，放宽间隔代价可接受
 */
const GLOBAL_REFRESH_MS = 60 * 1000
/**
 * 大宗商品与外汇刷新间隔（毫秒）
 * 这些品种几乎全天连续报价，且上游实测无 IP 级限流，可以用比国际指数更高的频率
 */
const COMMODITY_REFRESH_MS = 30 * 1000
/** 盘后、集合竞价等非连续竞价时段的刷新间隔（毫秒） */
const CN_HK_IDLE_REFRESH_MS = 60 * 1000
/**
 * 板块内全部指数都停更时的低频保活间隔（毫秒）
 * 交易阶段模型只能识别周末，节假日与临时休市靠行情时间发现后降档到这里
 */
const QUOTE_IDLE_POLL_MS = 5 * 60 * 1000
/** 时钟同步间隔（毫秒），用于跨时段后自动切换轮询状态 */
const CLOCK_TICK_MS = 30 * 1000

/** 沪深港指数查询接口（服务端转发腾讯行情接口，返回 GBK 解码后的原始行情文本） */
const QUOTE_API_URL = '/quote/query'
/** 国际指数查询接口（服务端转发东方财富行情接口，返回行情对象数组） */
const GLOBAL_QUOTE_API_URL = '/quote/global'
/** 大宗商品与外汇查询接口（服务端转发华尔街见闻行情数据中心，返回结构化品种数组） */
const COMMODITY_QUOTE_API_URL = '/quote/commodity'
/** 快讯相关接口与频道参数已随资讯模块移到 newsFlash/constants（/news/lives、/news/stream、/news/calendar） */
/**
 * 港股指数行情时间滞后说明
 * 实测腾讯对港股指数的行情时间戳（字段 [30]）恒定落后本地时钟约 15 分钟（源侧快照延迟），
 * 而价格是实时推进的；港股卡片因此改用响应到达时间判活跃，源时间保留展示并在悬停里说明滞后
 */
const HK_SNAPSHOT_LAG_NOTE = '（港股源行情时间固定滞后约 15 分钟，以本轮刷新时间判定是否在更新）'

/**
 * 各市场交易时段表
 * tz 用 IANA 时区名，夏令时与半时区（印度 +5:30）由 Intl 自动处理，不维护北京时间偏移；
 * ranges 为交易所当地的墙钟分钟数，左闭右开，未命中即视为休市
 * 只用于卡片标签展示，不参与轮询决策，时段写错也不会漏掉行情数据
 * 半日市（如感恩节提前收市、港股除夕半天）不建模，由「已停更」标签暴露
 */
const MARKET_SESSIONS: Record<string, ISessionSpec> = {
  // 沪深与北交所：9:15 开盘集合竞价、9:30-11:30 / 13:00-15:00 连续竞价、15:05-15:30 盘后固定价格交易
  CN: {
    place: '北京',
    tz: 'Asia/Shanghai',
    ranges: [
      { phase: '盘前', from: 9 * 60 + 15, to: 9 * 60 + 30 },
      { phase: '盘中', from: 9 * 60 + 30, to: 11 * 60 + 30 },
      { phase: '午休', from: 11 * 60 + 30, to: 13 * 60 },
      { phase: '盘中', from: 13 * 60, to: 15 * 60 },
      { phase: '盘后', from: 15 * 60 + 5, to: 15 * 60 + 30 },
    ],
  },
  // 港股：9:00 开市前竞价、9:30-12:00 / 13:00-16:00 持续交易、16:00-16:10 收盘竞价
  HK: {
    place: '香港',
    tz: 'Asia/Hong_Kong',
    ranges: [
      { phase: '盘前', from: 9 * 60, to: 9 * 60 + 30 },
      { phase: '盘中', from: 9 * 60 + 30, to: 12 * 60 },
      { phase: '午休', from: 12 * 60, to: 13 * 60 },
      { phase: '盘中', from: 13 * 60, to: 16 * 60 },
      { phase: '盘后', from: 16 * 60, to: 16 * 60 + 10 },
    ],
  },
  // 美股：04:00-09:30 盘前、09:30-16:00 常规时段、16:00-20:00 盘后（美东墙钟）
  US: {
    place: '纽约',
    tz: 'America/New_York',
    ranges: [
      { phase: '盘前', from: 4 * 60, to: 9 * 60 + 30 },
      { phase: '盘中', from: 9 * 60 + 30, to: 16 * 60 },
      { phase: '盘后', from: 16 * 60, to: 20 * 60 },
    ],
  },
  // 日股：08:45 开盘前收盘定价、09:00-11:30 / 12:30-15:30 两个时段
  JP: {
    place: '东京',
    tz: 'Asia/Tokyo',
    ranges: [
      { phase: '盘前', from: 8 * 60 + 45, to: 9 * 60 },
      { phase: '盘中', from: 9 * 60, to: 11 * 60 + 30 },
      { phase: '午休', from: 11 * 60 + 30, to: 12 * 60 + 30 },
      { phase: '盘中', from: 12 * 60 + 30, to: 15 * 60 + 30 },
    ],
  },
  // 韩股：08:30-09:00 开盘竞价、09:00-15:30 连续交易、15:40-18:00 盘后（此处从 15:30 起算）
  KR: {
    place: '首尔',
    tz: 'Asia/Seoul',
    ranges: [
      { phase: '盘前', from: 8 * 60 + 30, to: 9 * 60 },
      { phase: '盘中', from: 9 * 60, to: 15 * 60 + 30 },
      { phase: '盘后', from: 15 * 60 + 30, to: 18 * 60 },
    ],
  },
  // 台股：08:30-09:00 开盘竞价、09:00-13:30 连续交易、14:00-14:30 盘后时段
  TW: {
    place: '台北',
    tz: 'Asia/Taipei',
    ranges: [
      { phase: '盘前', from: 8 * 60 + 30, to: 9 * 60 },
      { phase: '盘中', from: 9 * 60, to: 13 * 60 + 30 },
      { phase: '盘后', from: 14 * 60, to: 14 * 60 + 30 },
    ],
  },
  // 英股：07:15-08:00 开盘竞价、08:00-16:30 连续交易
  UK: {
    place: '伦敦',
    tz: 'Europe/London',
    ranges: [
      { phase: '盘前', from: 7 * 60 + 15, to: 8 * 60 },
      { phase: '盘中', from: 8 * 60, to: 16 * 60 + 30 },
    ],
  },
  // 德股：Xetra 08:00-09:00 开盘竞价、09:00-17:30 连续交易
  DE: {
    place: '法兰克福',
    tz: 'Europe/Berlin',
    ranges: [
      { phase: '盘前', from: 8 * 60, to: 9 * 60 },
      { phase: '盘中', from: 9 * 60, to: 17 * 60 + 30 },
    ],
  },
  // 法股：07:15-09:00 开盘竞价、09:00-17:30 连续交易
  FR: {
    place: '巴黎',
    tz: 'Europe/Paris',
    ranges: [
      { phase: '盘前', from: 7 * 60 + 15, to: 9 * 60 },
      { phase: '盘中', from: 9 * 60, to: 17 * 60 + 30 },
    ],
  },
  // 印度：09:00-09:15 开盘竞价、09:15-15:30 连续交易、15:30-16:00 收市时段
  IN: {
    place: '孟买',
    tz: 'Asia/Kolkata',
    ranges: [
      { phase: '盘前', from: 9 * 60, to: 9 * 60 + 15 },
      { phase: '盘中', from: 9 * 60 + 15, to: 15 * 60 + 30 },
      { phase: '盘后', from: 15 * 60 + 30, to: 16 * 60 },
    ],
  },
  // 新加坡：08:30-09:00 开盘前、09:00-17:00 全天连续交易（无午间休市）
  SG: {
    place: '新加坡',
    tz: 'Asia/Singapore',
    ranges: [
      { phase: '盘前', from: 8 * 60 + 30, to: 9 * 60 },
      { phase: '盘中', from: 9 * 60, to: 17 * 60 },
    ],
  },
  // 澳洲：09:50-10:00 开盘竞价、10:00-16:00 连续交易（悉尼，夏令时自动偏移）
  AU: {
    place: '悉尼',
    tz: 'Australia/Sydney',
    ranges: [
      { phase: '盘前', from: 9 * 60 + 50, to: 10 * 60 },
      { phase: '盘中', from: 10 * 60, to: 16 * 60 },
    ],
  },
  // 俄罗斯：09:45-10:00 开盘竞价、10:00-18:50 连续交易
  RU: {
    place: '莫斯科',
    tz: 'Europe/Moscow',
    ranges: [
      { phase: '盘前', from: 9 * 60 + 45, to: 10 * 60 },
      { phase: '盘中', from: 10 * 60, to: 18 * 60 + 50 },
    ],
  },
  // 大宗商品与外汇：跟着悉尼/东京→伦敦→纽约的电子盘 24 小时接力，周一至周五连续报价，
  // 周六凌晨纽约收盘后休市至周一悉尼开盘，故按 UTC 全天计盘中，周末由 getMarketSession 统一判休市
  OTC: {
    place: '全球电子盘',
    tz: 'UTC',
    ranges: [{ phase: '盘中', from: 0, to: 24 * 60 }],
  },
}

/** 沪深港主要指数 */
const CN_HK_INDEXES: IIndexMeta[] = [
  { key: 'sh000001', label: '沪深', sessionKey: 'CN' }, // 上证指数
  { key: 'sz399001', label: '沪深', sessionKey: 'CN' }, // 深证成指
  { key: 'sz399006', label: '沪深', sessionKey: 'CN' }, // 创业板指
  { key: 'sh000300', label: '沪深', sessionKey: 'CN' }, // 沪深300
  { key: 'sh000016', label: '沪深', sessionKey: 'CN' }, // 上证50
  { key: 'sh000905', label: '沪深', sessionKey: 'CN' }, // 中证500
  { key: 'sh000852', label: '沪深', sessionKey: 'CN' }, // 中证1000
  { key: 'sh000688', label: '沪深', sessionKey: 'CN' }, // 科创50
  { key: 'bj899050', label: '北交所', sessionKey: 'CN' }, // 北证50（时段与沪深一致）
  { key: 'hkHSI', label: '港股', sessionKey: 'HK' }, // 恒生指数
  { key: 'hkHSTECH', label: '港股', sessionKey: 'HK' }, // 恒生科技指数
  { key: 'hkHSCEI', label: '港股', sessionKey: 'HK' }, // 恒生中国企业指数
]

/** 其他市场主要指数（含台湾加权） */
const GLOBAL_INDEXES: IIndexMeta[] = [
  { key: '100.DJIA', label: '美股', sessionKey: 'US' }, // 道琼斯工业
  { key: '100.SPX', label: '美股', sessionKey: 'US' }, // 标普500
  { key: '100.NDX', label: '美股', sessionKey: 'US' }, // 纳斯达克
  { key: '100.FTSE', label: '英股', sessionKey: 'UK' }, // 英国富时100
  { key: '100.GDAXI', label: '德股', sessionKey: 'DE' }, // 德国DAX30
  { key: '100.FCHI', label: '法股', sessionKey: 'FR' }, // 法国CAC40
  { key: '100.N225', label: '日股', sessionKey: 'JP' }, // 日经225
  { key: '100.KS11', label: '韩股', sessionKey: 'KR' }, // 韩国KOSPI
  { key: '100.TWII', label: '台股', sessionKey: 'TW' }, // 台湾加权
  { key: '100.STI', label: '新加坡', sessionKey: 'SG' }, // 海峡时报
  { key: '100.AS51', label: '澳洲', sessionKey: 'AU' }, // 澳大利亚标普200
  { key: '100.SENSEX', label: '印度', sessionKey: 'IN' }, // 印度孟买SENSEX
  { key: '100.RTS', label: '俄罗斯', sessionKey: 'RU' }, // 俄罗斯RTS
  // 富时中国A50：成分股全为 A 股，按沪深时段标注
  { key: '100.XIN9', label: '国际', sessionKey: 'CN' },
]

/**
 * 大宗商品与外汇固定清单（华尔街见闻行情数据中心的 prod_code）
 * 只收录实测可用的品种：该源没有工业金属与农产品（HG/CU/AL/ZS 等代码实测不返回）；
 * marketLabel 在同一 Tab 内承担分组表头职责，因此这里用它区分贵金属/能源/外汇
 */
const COMMODITY_PRODUCTS: IIndexMeta[] = [
  // 贵金属
  { key: 'XAUUSD.OTC', label: '贵金属', sessionKey: 'OTC' },
  { key: 'XAGUSD.OTC', label: '贵金属', sessionKey: 'OTC' },
  // 能源
  { key: 'USCL.OTC', label: '能源', sessionKey: 'OTC' },
  { key: 'UKOIL.OTC', label: '能源', sessionKey: 'OTC' },
  { key: 'USNG.OTC', label: '能源', sessionKey: 'OTC' },
  // 美元指数与主要货币对
  { key: 'DXY.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'EURUSD.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'GBPUSD.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'USDJPY.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'USDCNH.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'USDCNY.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'AUDUSD.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'USDCAD.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'EURJPY.OTC', label: '外汇', sessionKey: 'OTC' },
  { key: 'GBPJPY.OTC', label: '外汇', sessionKey: 'OTC' },
]

/** 沪深港指数代码串（腾讯接口入参） */
const CN_HK_INDEX_CODES: string = CN_HK_INDEXES.map((item: IIndexMeta) => item.key).join(',')
/** 国际指数 secid 串（东财接口入参） */
const GLOBAL_INDEX_SECIDS: string = GLOBAL_INDEXES.map((item: IIndexMeta) => item.key).join(',')
/** 大宗商品与外汇品种代码串（见闻接口入参） */
const COMMODITY_PRODUCT_CODES: string = COMMODITY_PRODUCTS.map(
  (item: IIndexMeta) => item.key
).join(',')

export {
  COLOR_UP,
  COLOR_DOWN,
  COLOR_FLAT,
  EMPTY_TEXT,
  INDEX_PRICE_FONT_SIZE,
  INDEX_CHANGE_FONT_SIZE,
  ORDER_BOOK_LEVELS,
  CODES_STORAGE_KEY,
  TAB_STOCK,
  TAB_CN_HK,
  TAB_GLOBAL,
  TAB_COMMODITY,
  ACTIVE_TAB_STORAGE_KEY,
  CN_HK_REFRESH_MS,
  GLOBAL_REFRESH_MS,
  COMMODITY_REFRESH_MS,
  CN_HK_IDLE_REFRESH_MS,
  QUOTE_IDLE_POLL_MS,
  CLOCK_TICK_MS,
  QUOTE_API_URL,
  GLOBAL_QUOTE_API_URL,
  COMMODITY_QUOTE_API_URL,
  HK_SNAPSHOT_LAG_NOTE,
  MARKET_SESSIONS,
  CN_HK_INDEXES,
  GLOBAL_INDEXES,
  COMMODITY_PRODUCTS,
  CN_HK_INDEX_CODES,
  GLOBAL_INDEX_SECIDS,
  COMMODITY_PRODUCT_CODES,
}
