/**
 * 资讯快讯页面的共享类型
 * 上游（华尔街见闻 lives / WS 推送）为 snake_case 原始结构，服务端纯透传 + 加盐，
 * 由 utils/news.normalizeNewsItem 转成这里的展示用结构；财经日历指标走独立的 /news/calendar 结构
 */

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

export {
  INewsItem,
  INewsArticle,
  INewsCalendar,
  INewsCalendarResult,
  INewsLivesPayload,
  INewsLivesResult,
}
