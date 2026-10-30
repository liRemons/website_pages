/**
 * 资讯快讯数据源
 * 与其它行情 Tab 一样只在激活时发请求，但节奏完全不同：
 * - 进入 Tab 拉第一页（服务端转发华尔街见闻 lives 接口）
 * - 滚到底用 next_cursor 取下一页，追加到列表尾部
 * - 服务端常驻长连接收到的推送，通过 SSE（/news/stream）实时推给前端，追加到列表头部并高亮
 * - 条目带 calendar_key（经济数据快讯）时，按 key 去重后拉 /news/calendar 取今值/预期/前值/国旗
 * 列表与推送经服务端规整为同一结构，值经加盐链路后均为字符串，统一在这里转成数值
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { service } from '@axios'
import { HOST, USER_TOKEN } from '@utils'
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

interface INewsFeedArgs {
  /** 是否为当前激活 Tab，只有激活的一路发请求与轮询 */
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

function useNewsFeed(args: INewsFeedArgs): INewsFeedState {
  const { enabled, importantOnly } = args
  const [items, setItems] = useState<INewsItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [newCount, setNewCount] = useState<number>(0)
  const [calendarData, setCalendarData] = useState<Record<string, INewsCalendar>>({})

  // 已收录条目 id，用于列表/推送交叉去重
  const idsRef = useRef<Set<number>>(new Set())
  // 已看到的最大条目 id，作为推送增量的游标
  const maxIdRef = useRef<number>(0)
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

  /** 收集未见过的条目并同步去重集合与最大 id，返回增量 */
  const collect = useCallback((list: INewsItem[]): INewsItem[] => {
    const fresh: INewsItem[] = []
    list.forEach((item: INewsItem) => {
      if (!item.id || idsRef.current.has(item.id)) return
      idsRef.current.add(item.id)
      if (item.id > maxIdRef.current) maxIdRef.current = item.id
      fresh.push(item)
    })
    return fresh
  }, [])

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
   */
  const fetchPage = useCallback(
    async (mode: 'init' | 'more'): Promise<void> => {
      if (inFlightRef.current) return
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
        const list: INewsItem[] = res.data.items.map(normalizeNewsItem)
        // 带 calendar_key 的条目排队拉取经济数据指标（今值/预期/前值/国旗）
        scheduleCalendar(list)
        cursorRef.current = String(res.data.next_cursor || '')
        // 透传后无独立 hasMore 字段：本页有条目且带回 next_cursor 即认为还有下一页
        setHasMore(res.data.items.length > 0 && Boolean(res.data.next_cursor))
        setError('')
        if (mode === 'init') {
          idsRef.current = new Set()
          maxIdRef.current = 0
          const fresh = collect(list)
          setItems(fresh)
          setNewCount(0)
        } else {
          // 翻页拿到的是更早的条目，追加到底部
          const older = collect(list)
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
    [collect, importantOnly, scheduleCalendar]
  )

  // 进入 Tab 且未发起过首屏时拉一次；切走再回来沿用已加载数据，不重复首屏
  // 筛选条件（只看重要）变化时重置初始化标志，重新拉第一页以应用新筛选
  const lastFilterRef = useRef<boolean>(importantOnly)
  useEffect(() => {
    if (!enabled) {
      return
    }
    if (lastFilterRef.current !== importantOnly) {
      lastFilterRef.current = importantOnly
      initStartedRef.current = false
    }
    if (!initStartedRef.current) {
      initStartedRef.current = true
      fetchPage('init')
    }
  }, [enabled, importantOnly, fetchPage])

  // 用 SSE 长连接接收服务端实时推送：连上即推、断线由浏览器自动重连；仅在资讯 Tab 激活时保持。
  // EventSource 不能带自定义头，先经 /news/streamTicket（带头、走会话密钥）申领短期票据，再用 ?ticket= 建流；
  // 每条推送用与建票同一登录 token 派生的会话密钥 AES-256-GCM 解密。
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
      // 透传后推送体与列表 item 同形（snake_case），共用同一个解析函数
      const item: INewsItem = normalizeNewsItem(raw)
      // 只看重要时，非重要（score!==2）的新推送直接丢弃，保持列表与筛选一致
      if (importantOnly && item.score !== NEWS_IMPORTANT_SCORE) {
        return
      }
      // 舍弃乱序：推送 id 不大于已见最大 id（即不比当前最新还新，多半是延迟到达的旧快讯），
      // 若仍置顶会打乱时间倒序，这里直接丢弃（id 随发布时间单调递增，可作新旧判据）
      if (item.id <= maxIdRef.current) {
        return
      }
      const fresh: INewsItem[] = collect([item])
      if (fresh.length === 0) {
        return
      }
      // 推送条目同样登记日历指标需求
      scheduleCalendar(fresh)
      // 新快讯置顶并标记为高亮
      setItems((prev: INewsItem[]) => [{ ...fresh[0], isNew: true }, ...prev])
      setNewCount((prev: number) => prev + 1)
        }
      })
      .catch(() => {
        /* 申票失败（如登录失效）：本次不建流，enabled 变化后依赖重跑再试 */
      })

    return (): void => {
      cancelled = true
      if (source) source.close()
    }
  }, [enabled, importantOnly, collect, fetchPage, scheduleCalendar])

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
