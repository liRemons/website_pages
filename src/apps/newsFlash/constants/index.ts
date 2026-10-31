/**
 * 资讯快讯页面的常量
 * 只留快讯链路用得上的几项：重要条目的标红色、时间戳非法时的占位符、顶部实时时钟步长，以及接口地址与频道参数
 * （行情那套配色、指数品种清单、交易时段表已随资讯独立成页而无关，仍留在 timeSeriesMetrics/constants）
 */

/** A股红涨配色：score=2 的重点快讯用它标红时刻、标题与正文 */
const COLOR_UP = '#cf1322'

/** 数值缺失时的占位符 */
const EMPTY_TEXT = '-'

/**
 * 顶部实时时钟步长（毫秒）：1 秒一跳，让顶部时间像走针一样持续更新（HH:mm:ss）
 * 只喂给叶子组件 LiveClock，不进主列表状态，避免整条列表每秒跟着重渲染
 */
const CLOCK_LIVE_TICK_MS = 1000

/** 资讯快讯列表接口（服务端转发华尔街见闻 lives 接口，返回首屏与游标翻页） */
const NEWS_LIVES_API_URL = '/news/lives'
/** 资讯快讯实时推送接口（SSE 长连接，服务端把常驻上游 WS 的新快讯实时推下来） */
const NEWS_STREAM_API_URL = '/news/stream'
/** 快讯关联财经日历指标接口（服务端转发见闻 finance/item/key，按 calendar_key 拉今值/预期/前值/国旗） */
const NEWS_CALENDAR_API_URL = '/news/calendar'
/**
 * 资讯拉取频道清单（进页/翻页 lives 与 SSE 建流统一带上，逗号拼接 key 透传上游）
 * key = 华尔街见闻频道标识，label = 展示用板块名；每条快讯的类型标签据 channels 命中本表得出
 */
const NEWS_CHANNELS: Array<{ key: string; label: string }> = [
  { key: 'global-channel', label: '要闻' },
  { key: 'a-stock-channel', label: 'A股' },
  { key: 'us-stock-channel', label: '美股' },
  { key: 'hk-stock-channel', label: '港股' },
  { key: 'forex-channel', label: '外汇' },
  { key: 'goldc-channel', label: '商品' },
  { key: 'bond-channel', label: '债券' },
]
/** channel 入参串：lives 接口与 SSE 建流都用它（逗号分隔，由清单 key 拼接） */
const NEWS_CHANNEL = NEWS_CHANNELS.map((c) => c.key).join(',')
/** 频道 key -> 板块名（供类型标签反查） */
const NEWS_CHANNEL_LABELS: Record<string, string> = NEWS_CHANNELS.reduce(
  (map: Record<string, string>, c: { key: string; label: string }) => {
    map[c.key] = c.label
    return map
  },
  {}
)
/** 资讯单页条数 */
const NEWS_PAGE_LIMIT = 20
/** 资讯「重要」分值：勾选只看重要时，向 lives 接口传 score=NEWS_IMPORTANT_SCORE 做上游筛选 */
const NEWS_IMPORTANT_SCORE = 2

export {
  COLOR_UP,
  EMPTY_TEXT,
  CLOCK_LIVE_TICK_MS,
  NEWS_LIVES_API_URL,
  NEWS_STREAM_API_URL,
  NEWS_CALENDAR_API_URL,
  NEWS_CHANNELS,
  NEWS_CHANNEL,
  NEWS_CHANNEL_LABELS,
  NEWS_PAGE_LIMIT,
  NEWS_IMPORTANT_SCORE,
}
