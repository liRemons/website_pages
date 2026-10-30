/**
 * 资讯快讯数据源
 * 与监控页那些行情数据源一样只在需要时发请求，但节奏完全不同：
 * - 进页拉第一页（服务端转发华尔街见闻 lives 接口）
 * - 滚到底用 next_cursor 取下一页，追加到列表尾部
 * - 服务端常驻长连接收到的推送，通过 SSE（/news/stream）实时推给前端（服务端纯转发、不去重），
 *   去重/折叠规则见 utils/eventDedup（R2 同 id 就地替换 → R1 跨 id 同标题 → R3 跨 id 同正文 → 乱序护栏 → 新增）；
 *   首屏请求在途期间到达的推送帧会暂存重放，避免 init 重置事件槽后同事件的两帧各渲染一条
 * - 条目带 calendar_key（经济数据快讯）时，按 key 去重后拉 /news/calendar 取今值/预期/前值/国旗
 * 列表与推送经服务端规整为同一结构，值经加盐链路后均为字符串，统一在这里转成数值
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSearchParams } from 'methods-r'
import { service } from '@axios'
import { HOST, USER_TOKEN } from '@utils'
import { notify } from '@utils/notify'
import { aesDecryptStr, deriveSessionKey } from '@utils/sessionCrypto'
import { INewsCalendar, INewsCalendarResult, INewsItem, INewsLivesResult } from '../types'
import {
  NEWS_CALENDAR_API_URL,
  NEWS_CHANNEL,
  NEWS_IMPORTANT_SCORE,
  NEWS_LIVES_API_URL,
  NEWS_PAGE_LIMIT,
  NEWS_STREAM_API_URL,
} from '../constants'
import { calendarKeyOf, normalizeNewsItem } from '../utils/news'
import { IFeedCtx, applySsePush, collectItems, createFeedCtx } from '../utils/eventDedup'

/**
 * 调试日志专用引用：生产 webpack 的 terser 开了 drop_console: true，会把所有 `console.xxx()` 直接调用剩剥离，
 * 导致 URL 带 isDebug=true 也看不到输出。这里先把 console.log 用 .bind 抽成变量，
 * terser 无法识别为纯函数保留 → 后续 debugLog(...) 调用不被剪掉，只用于 isDebug 分支
 */
const debugLog: (...args: unknown[]) => void = console.log.bind(console)

interface INewsFeedArgs {
  /** 是否允许发请求（登录态校验通过后为 true），未通过时不发首屏也不连 SSE */
  enabled: boolean
  /** 只看「重要」：true 时向 lives 传 score=2，并对 SSE 推送按分值过滤 */
  importantOnly: boolean
}

interface INewsFeedState {
  /** 按时间倒序（最新在前）展示的快讯 */
  items: INewsItem[]
  /** 首屏加载中 */
  loading: boolean
  /** 翻页加载中 */
  loadingMore: boolean
  /** 加载失败文案，空串表示正常 */
  error: string
  /** 是否还有下一页 */
  hasMore: boolean
  /** 自上次阅读以来新推送的条数 */
  newCount: number
  /** calendarKey -> 财经日历指标（今值/预期/前值/国旗），拉取失败或无数据时为空串 */
  calendarData: Record<string, INewsCalendar>
  /** 触底加载下一页 */
  loadMore: () => void
  /** 重新拉取第一页 */
  refresh: () => Promise<void>
  /** 用户回到顶部查看后清除新快讯计数与高亮 */
  ackNew: () => void
}

/**
 * 去重与折叠规则（EVENT_DUP_WINDOW_MS/titleKeyOf/contentKeyOf/displaySig/R1・R2・R3/乱序护栏）
 * 已抽到 utils/eventDedup，与 hook 状态解耦，纯函数可直接被脚本引用验证
 */
function useNewsFeed(args: INewsFeedArgs): INewsFeedState {
  const { enabled, importantOnly } = args
  const [items, setItems] = useState<INewsItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [newCount, setNewCount] = useState<number>(0)
  const [calendarData, setCalendarData] = useState<Record<string, INewsCalendar>>({})

  // 去重与事件槽上下文（ids/titleRef/contentRef/maxId），规则与生命周期见 utils/eventDedup
  const feedRef = useRef<IFeedCtx>(createFeedCtx())
  // 请求在途期间到达的 SSE 帧：init 重置事件槽后需要重放，否则同事件的两帧会各渲染一条
  const pendingSseRef = useRef<INewsItem[]>([])
  // 下一页游标（最旧一条的时间游标）
  const cursorRef = useRef<string>('')
  // 首屏是否已发起，避免 StrictMode 双挂载重复请求
  const initStartedRef = useRef<boolean>(false)
  // 是否有请求在途，翻页与首屏互斥
  const inFlightRef = useRef<boolean>(false)
  // 已发起过日历指标请求的键（含失败的），同一 key 只请求一次
  const calendarRequestedRef = useRef<Set<string>>(new Set())
  // 待拉取日历指标的条目队列，微任务批量合并后串行发送
  const calendarQueueRef = useRef<string[]>([])

  /**
   * 重放请求在途期间积压的 SSE 帧：init 重置把事件槽清空了，若同事件的两帧（如 create 与紧随的 update）
   * 分别在重置前后落地，R1/R3 会因槽位丢失双双判为新条目、各渲染一条；这里把未被本次列表覆盖的帧
   * 按正常推送链重放一次（带完整折叠规则），已在列表里的 id 直接丢弃
   */
  const replayPending = useCallback((): void => {
    const pend: INewsItem[] = pendingSseRef.current
    pendingSseRef.current = []
    pend.forEach((p: INewsItem) => {
      if (feedRef.current.ids.has(p.id)) return
      if (applySsePush(feedRef.current, setItems, p)) {
        setItems((prev: INewsItem[]) => {
          if (prev.some((q: INewsItem) => q.id === p.id)) return prev
          return [{ ...p, isNew: true }, ...prev]
        })
        setNewCount((prev: number) => prev + 1)
      }
    })
  }, [])

  // 调试开关：URL 带 isDebug=true 时，把服务端原始推送（SSE）与原始列表（lives）原样打到控制台，
  // 不做任何字段列举/投影；前端 items 是 normalizeNewsItem 后的投影，不属「原样」范围，故不再额外输出
  const isDebug: boolean = getSearchParams('isDebug') === 'true'

  /**
   * 冲刷日历指标队列：串行拉取 /news/calendar，结果按 key 存入 calendarData
   * 队列在微任务里合并，同一批翻页/推送的多个 key 一次效果上成组发出；
   * 失败或无数据也记入已请求集合（scheduleCalendar），不重试，避免异常 key 反复穿透
   */
  const flushCalendar = useCallback(async (): Promise<void> => {
    const keys: string[] = calendarQueueRef.current
    calendarQueueRef.current = []
    for (let i = 0; i < keys.length; i += 1) {
      const key: string = keys[i]
      try {
        const [calendarKey, calendarType] = key.split('|')
        const res = (await service({
          method: 'get',
          url: NEWS_CALENDAR_API_URL,
          params: { calendar_key: calendarKey, calendar_type: calendarType },
        })) as INewsCalendarResult
        if (res.success && res.data) {
          setCalendarData((prev: Record<string, INewsCalendar>) => ({
            ...prev,
            [key]: res.data as INewsCalendar,
          }))
        }
      } catch (err) {
        // 单条指标失败不影响其余，也不阻断列表展示
      }
    }
  }, [])

  /**
   * 登记条目里的 calendar_key：去重后进队列，微任务结束时统一冲刷
   * 同一页/同一推送里重复 key 只拉一次；翻页、首屏、SSE 三条入口共用本登记
   */
  const scheduleCalendar = useCallback((list: INewsItem[]): void => {
    let hasNew = false
    list.forEach((item: INewsItem) => {
      const key: string = calendarKeyOf(item)
      if (!key || calendarRequestedRef.current.has(key)) {
        return
      }
      calendarRequestedRef.current.add(key)
      calendarQueueRef.current.push(key)
      hasNew = true
    })
    if (hasNew) {
      Promise.resolve().then(() => {
        flushCalendar()
      })
    }
  }, [flushCalendar])

  /**
   * 拉取一页（mode=init 重置并覆盖，mode=more 追加到尾部）
   * 首屏与翻页共用一个请求函数，差异只在覆盖还是追加
   * force=true（筛选切换）时绕过在途互斥：旧翻页结果会被 init 覆盖，不能让在途请求吃掉重拉
   */
  const fetchPage = useCallback(
    async (mode: 'init' | 'more', force?: boolean): Promise<void> => {
      if (inFlightRef.current && !(force && mode === 'init')) return
      inFlightRef.current = true
      if (mode === 'init') {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      try {
        const params: Record<string, string | number> = {
          channel: NEWS_CHANNEL,
          limit: NEWS_PAGE_LIMIT,
        }
        // 只看重要：向 lives 接口传 score=2 做上游筛选（服务端透传）
        if (importantOnly) {
          params.score = NEWS_IMPORTANT_SCORE
        }
        if (mode === 'more' && cursorRef.current) {
          params.cursor = cursorRef.current
        }
        const res = (await service({
          method: 'get',
          url: NEWS_LIVES_API_URL,
          params,
        })) as INewsLivesResult
        if (!res.success || !res.data || !Array.isArray(res.data.items)) {
          throw new Error(res.msg || '资讯加载失败')
        }
        // 调试：直接原样打印服务端 lives 接口返回的 items（未投影），不做字段列举
        if (isDebug) {
          debugLog('[newsFlash][debug] lives raw', res.data.items)
        }
        const list: INewsItem[] = res.data.items.map(normalizeNewsItem)
        // 带 calendar_key 的条目排队拉取经济数据指标（今值/预期/前值/国旗）
        scheduleCalendar(list)
        cursorRef.current = String(res.data.next_cursor || '')
        // 透传后无独立 hasMore 字段：本页有条目且带回 next_cursor 即认为还有下一页
        setHasMore(res.data.items.length > 0 && Boolean(res.data.next_cursor))
        setError('')
        if (mode === 'init') {
          feedRef.current = createFeedCtx()
          const fresh = collectItems(feedRef.current, list)
          setItems(fresh)
          setNewCount(0)
          // 在途期到达的推送帧不丢：重放回折叠链，堵住「init 重置抹掉事件槽→同事件两帧各渲染一条」的竞态
          replayPending()
        } else {
          // 翻页拿到的是更早的条目，追加到底部
          const older = collectItems(feedRef.current, list)
          setItems((prev: INewsItem[]) => [...prev, ...older])
        }
      } catch (err) {
        // tslint:disable-next-line:no-console
        console.error('Fetch news error:', err)
        setError(err instanceof Error ? err.message : '资讯暂不可用，请稍后重试')
      } finally {
        inFlightRef.current = false
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [importantOnly, isDebug, replayPending, scheduleCalendar]
  )

  // 登录态就绪且未发起过首屏时拉一次；筛选条件（只看重要）变化时重置初始化标志，重新拉第一页以应用新筛选
  const lastFilterRef = useRef<boolean>(importantOnly)
  useEffect(() => {
    if (!enabled) {
      return
    }
    if (lastFilterRef.current !== importantOnly) {
      lastFilterRef.current = importantOnly
      initStartedRef.current = false
      // 筛选切换一律回到第一页：立即清空旧列表与游标状态，避免旧筛选条目在重拉期间
      // 继续占位，导致视口停在错乱的深层位置（配合 NewsBoard 的切筛选回顶滚动条归零）
      cursorRef.current = ''
      feedRef.current = createFeedCtx()
      pendingSseRef.current = []
      setItems([])
      setHasMore(false)
      setNewCount(0)
    }
    if (!initStartedRef.current) {
      initStartedRef.current = true
      fetchPage('init', true)
    }
  }, [enabled, importantOnly, fetchPage])

  // 用 SSE 长连接接收服务端实时推送：连上即推、断线由浏览器自动重连；仅在登录态就绪时保持。
  // EventSource 不能带自定义头，故先经 /news/streamTicket（带头、走会话密钥）申领短期票据，
  // 再用 ?ticket= 建流；每条推送用与建票同一登录 token 派生的会话密钥 AES-256-GCM 解密。
  useEffect(() => {
    const token: string = localStorage.getItem(USER_TOKEN) || ''
    if (!enabled || !token || typeof EventSource === 'undefined') {
      return
    }
    const aesKey: Uint8Array | null = deriveSessionKey(token)
    if (!aesKey) return
    let source: EventSource | null = null
    let cancelled = false

    // 先申票（本接口能带头、走会话密钥加密回传），拿到 ticket 再建流
    service({ method: 'get', url: '/news/streamTicket', quiet: true })
      .then((res: { data?: { ticket?: string } }) => {
        if (cancelled) return
        const ticket: string | undefined = res && res.data && res.data.ticket
        if (!ticket) return
        const streamUrl: string = `${HOST}${NEWS_STREAM_API_URL}?ticket=${encodeURIComponent(ticket)}&channel=${encodeURIComponent(NEWS_CHANNEL)}`
        source = new EventSource(streamUrl)
        // 同一连接内首次 open 是初始建连，之后的 open 视为断线重连
        let opened: boolean = false
        source.onopen = (): void => {
          if (opened) {
            // 重连补齐断连期间可能错过的快讯：仅重连时拉一次，不做周期轮询
            fetchPage('init')
          } else {
            opened = true
          }
        }
        source.onmessage = (event: MessageEvent): void => {
          // 事件体是服务端按本会话密钥 AES-256-GCM 加密的密文，解回 JSON 字符串再解析
          let plain: string = ''
          try {
            plain = aesDecryptStr(String(event.data), aesKey)
          } catch (err) {
            return
          }
          if (!plain) {
            return
          }
      let raw: Record<string, unknown>
      try {
        raw = JSON.parse(plain) as Record<string, unknown>
      } catch (err) {
        return
      }
      // 调试：直接原样打印 SSE 推送解密后的 raw 对象（服务端透传的全部字段），不做字段列举
      if (isDebug) {
        debugLog('[newsFlash][debug] SSE raw', raw)
      }
      // 透传后推送体与列表 item 同形（snake_case），共用同一个解析函数
      const item: INewsItem = normalizeNewsItem(raw)
      // 只看重要时，非重要（score!==2）的新推送直接丢弃，保持列表与筛选一致
      if (importantOnly && item.score !== NEWS_IMPORTANT_SCORE) {
        return
      }
      // 请求在途期间到达的帧先记档：init 完成会重置事件槽，靠它在重置后重放，不丢折叠上下文
      if (!pendingSseRef.current.some((p: INewsItem) => p.id === item.id)) {
        pendingSseRef.current.push(item)
      }
      // R2→R1→R3→乱序护栏→新增：规则见 utils/eventDedup；就地折叠返回 false，只有新条目返回 true
      // （必须排在乱序护栏之前的逻辑已在 helper 内保证：更新条目 id 可能 ≤ maxId，不能被乱序误丢）
      if (!applySsePush(feedRef.current, setItems, item)) {
        return
      }
      // 新快讯置顶并标记为高亮（helper 只做判定与事件槽登记，插入由这里完成）
      setItems((prev: INewsItem[]) => {
        if (prev.some((p: INewsItem) => p.id === item.id)) return prev
        return [{ ...item, isNew: true }, ...prev]
      })
      setNewCount((prev: number) => prev + 1)
      // 推送条目同样登记日历指标需求
      scheduleCalendar([item])
      // 本地通知：只对「重要」快讯（score===2）推一条到通知栏，普通快讯只在列表置顶不高亮打扰；
      // 且只在 SSE 实时推送这条路发——刷新（fetchPage init）、分页（fetchPage more）与重连补齐都不通知
      // （@utils/notify 自带环境分流：App 走 plus.push，浏览器走 Web Notification；
      // app-pages.js 不在浏览器 bundle 中加载，不能作为浏览器的通知入口）
      // 点击通知由业务层 window.onNotifyClick 接管跳转（见 app.tsx）
      if (item.score === NEWS_IMPORTANT_SCORE) {
        const notifyTitle: string = item.title || item.contentText.slice(0, 20)
        const notifyBody: string = item.title ? item.contentText : item.contentText.slice(0, 50)
        notify(notifyBody || notifyTitle, {
          title: notifyTitle,
          payload: { page: 'newsFlash', id: item.id },
          tag: 'newsFlash',
        })
      }
        }
      })
      .catch(() => {
        /* 申票失败（如登录失效）：本次不建流，enabled/token 变化后依赖重跑再试 */
      })

    return (): void => {
      cancelled = true
      if (source) source.close()
    }
  }, [enabled, importantOnly, fetchPage, isDebug, scheduleCalendar])

  const loadMore = useCallback((): void => {
    if (!hasMore || inFlightRef.current) {
      return
    }
    fetchPage('more')
  }, [hasMore, fetchPage])

  const refresh = useCallback(async (): Promise<void> => {
    initStartedRef.current = true
    await fetchPage('init')
  }, [fetchPage])

  // 用户查看最新后清除「新快讯」标记与计数
  const ackNew = useCallback((): void => {
    setNewCount(0)
    setItems((prev: INewsItem[]) =>
      prev.some((item: INewsItem) => item.isNew)
        ? prev.map((item: INewsItem) => (item.isNew ? { ...item, isNew: false } : item))
        : prev
    )
  }, [])

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    newCount,
    calendarData,
    loadMore,
    refresh,
    ackNew,
  }
}

export { INewsFeedArgs, INewsFeedState, useNewsFeed }
