/**
 * 指数与品种行情的通用数据源
 * 三个行情 Tab 的状态与取数完全同构，只有节奏不同，故收敛成一个引擎：
 * 拉取 → 用上游行情时间判活跃 → 按自动轮询（autoPoll）或手动 refresh 取数，且只有激活的那一路发请求
 * 手动刷新 Tab 另配 cacheKey，命中前端 sessionStorage 缓存则直接复用、不请求；未命中则进 Tab 立即取数
 */

import { useCallback, useEffect, useState } from 'react'
import { IQuote } from '../types'
import { ActivityState, judgeActivity } from '../utils/market'
import { resolveIndexIntervalMs } from '../utils/schedule'
import { readFeedCache, writeFeedCache } from '../utils/feedCache'

/** 单次取数的结果：行情列表，外加服务端降级信息 */
interface IFeedSnapshot {
  /** 已按清单顺序重排的行情列表 */
  list: IQuote[]
  /** 上游限流/异常时服务端回退缓存，此时展示的不是最新数据 */
  stale?: boolean
  /** 回退数据在服务端的取回时间（毫秒），0 表示无可回退的时间 */
  cachedAt?: number
}

interface IFeedOptions {
  /** 是否为当前激活 Tab，只有激活的一路参与请求与轮询 */
  enabled: boolean
  /** 基础轮询间隔（毫秒），0 表示当前阶段不轮询 */
  baseIntervalMs: number
  /**
   * 是否自动轮询，默认 true
   * 为 false 时进入 Tab 只拉一次，后续由调用方拿 refresh 手动触发（其他市场与大宗商品 Tab 用）
   */
  autoPoll?: boolean
  /** 取数失败时的兜底文案 */
  errorText: string
  /** 控制台日志前缀，用于区分是哪一路数据源 */
  logTag: string
  /** 是否优先展示服务端回传的错误消息（沪深港沿用固定文案） */
  serverMessageFirst?: boolean
  /** 取数函数，调用方需用 useCallback 保持引用稳定，否则定时器每轮重建 */
  fetcher: () => Promise<IFeedSnapshot>
  /** 时钟快照，用于行情活跃度判定 */
  now: number
  /**
   * 前端结果缓存键（sessionStorage），仅不轮询的手动刷新 Tab 传入
   * 传入后：进入 Tab 先试读缓存，命中则直接复用不发请求；取数成功再写回
   */
  cacheKey?: string
  /** 前端缓存有效期（毫秒），配合 cacheKey 使用；默认不限时，只要存过缓存就直接复用（要最新请手动刷新） */
  cacheTtlMs?: number
}

interface IFeedState {
  list: IQuote[]
  loading: boolean
  /** 服务端降级或取数失败的提示文案，空串表示正常 */
  error: string
  /** 当前展示的是否为服务端回退的旧数据 */
  stale: boolean
  /** 回退数据的取回时间 */
  cachedAt: number
  /** 数据驱动的板块活跃度，决定卡片上的「更新中/已停更」 */
  activity: ActivityState
  /** 活跃度纠偏后的实际轮询间隔，0 表示已暂停 */
  intervalMs: number
  /** 手动取数一次，供手动刷新按钮调用（autoPoll 为 false 时是唯一的取数入口） */
  refresh: () => Promise<void>
}

function useQuoteFeed(options: IFeedOptions): IFeedState {
  const {
    enabled,
    baseIntervalMs,
    autoPoll = true,
    errorText,
    logTag,
    serverMessageFirst = true,
    fetcher,
    now,
    cacheKey = '',
    cacheTtlMs = Number.POSITIVE_INFINITY,
  } = options
  const [list, setList] = useState<IQuote[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [stale, setStale] = useState<boolean>(false)
  const [cachedAt, setCachedAt] = useState<number>(0)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const snapshot: IFeedSnapshot = await fetcher()
      setList(snapshot.list)
      setError('')
      setStale(snapshot.stale === true)
      setCachedAt(snapshot.cachedAt || 0)
      // 有 cacheKey 的（手动刷新 Tab）把成功结果落到 sessionStorage，供切回时直接复用（不限时，要最新靠手动刷新）
      if (cacheKey) {
        writeFeedCache(cacheKey, {
          data: snapshot.list,
          stale: snapshot.stale === true,
          cachedAt: snapshot.cachedAt || 0,
        })
      }
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error(logTag, err)
      // 服务端原因直接展示在状态行（轮询接口已屏蔽全局 toast），限流恢复后下一轮会自动清掉
      const serverText: string =
        serverMessageFirst && err instanceof Error ? err.message : ''
      setError(serverText || errorText)
      setStale(false)
    } finally {
      setLoading(false)
    }
  }, [cacheKey, errorText, fetcher, logTag, serverMessageFirst])

  // 上游限流回退缓存时行情时间会越存越旧，不能据此判定休市而降频，
  // 否则限流解除后要等一个低频周期才能拿到新数据
  const activity: ActivityState = stale
    ? 'active'
    : judgeActivity(
        list.map((item: IQuote) => item.quoteAt),
        now
      )
  const intervalMs: number = resolveIndexIntervalMs(baseIntervalMs, activity)

  // 进入 Tab 取一次数：先试命中前端缓存（手动刷新 Tab，不限时），命中即直接复用、不发请求；
  // 未命中（首次进入或无缓存）则立即取数，有旧数据时刷新、无数据时走 loading 等待请求完成
  useEffect(() => {
    if (!enabled) {
      return
    }
    if (cacheKey) {
      const hit = readFeedCache(cacheKey, cacheTtlMs)
      if (hit) {
        setList(hit.data)
        setStale(hit.stale === true)
        setCachedAt(hit.cachedAt || 0)
        setError('')
        return
      }
    }
    refresh()
  }, [enabled, refresh, cacheKey, cacheTtlMs])
  // 自动轮询：仅在开启轮询且有有效间隔时挂定时器，切走或手动模式即清理
  useEffect(() => {
    if (!enabled || !autoPoll || !intervalMs) {
      return
    }
    const timer = setInterval(refresh, intervalMs)
    return () => clearInterval(timer)
  }, [enabled, autoPoll, intervalMs, refresh])

  return { list, loading, error, stale, cachedAt, activity, intervalMs, refresh }
}

export {
  IFeedSnapshot,
  IFeedOptions,
  IFeedState,
  useQuoteFeed,
}
