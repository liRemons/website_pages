/**
 * 资讯快讯页面的常量
 * 只留快讯链路用得上的三项：重要条目的标红色、时间戳非法时的占位符、页面时钟步长，以及接口地址与频道参数
 * （行情那套配色、指数品种清单、交易时段表已随资讯独立成页而无关，仍留在 timeSeriesMetrics/constants）
 */

/** A股红涨配色：score=2 的重点快讯用它标红时刻、标题与正文 */
const COLOR_UP = '#cf1322'

/** 数值缺失时的占位符 */
const EMPTY_TEXT = '-'

/**
 * 时钟同步间隔（毫秒）
 * 资讯列表本身不轮询（靠 SSE 推送），这个时钟只为顶部状态行的日期兜底：
 * 页面整夜开着、列表还没数据时，跨零点后日期文案要自己换成新的一天
 */
const CLOCK_TICK_MS = 30 * 1000

/** 资讯快讯列表接口（服务端转发华尔街见闻 lives 接口，返回首屏与游标翻页） */
const NEWS_LIVES_API_URL = '/news/lives'
/** 资讯快讯实时推送接口（SSE 长连接，服务端把常驻上游 WS 的新快讯实时推下来） */
const NEWS_STREAM_API_URL = '/news/stream'
/** 快讯关联财经日历指标接口（服务端转发见闻 finance/item/key，按 calendar_key 拉今值/预期/前值/国旗） */
const NEWS_CALENDAR_API_URL = '/news/calendar'
/** 资讯默认频道：全球频道，与服务端转发上游的 channel 一致 */
const NEWS_CHANNEL = 'global-channel'
/** 资讯单页条数 */
const NEWS_PAGE_LIMIT = 20
/** 资讯「重要」分值：勾选只看重要时，向 lives 接口传 score=NEWS_IMPORTANT_SCORE 做上游筛选 */
const NEWS_IMPORTANT_SCORE = 2

export {
  COLOR_UP,
  EMPTY_TEXT,
  CLOCK_TICK_MS,
  NEWS_LIVES_API_URL,
  NEWS_STREAM_API_URL,
  NEWS_CALENDAR_API_URL,
  NEWS_CHANNEL,
  NEWS_PAGE_LIMIT,
  NEWS_IMPORTANT_SCORE,
}
