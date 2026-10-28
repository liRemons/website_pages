/**
 * 三个行情 Tab 的数据源适配
 * 各自只负责「调用服务端 + 解析成 IQuote + 按清单顺序重排」，
 * 状态维护与轮询节奏交给 useQuoteFeed，此处不重复实现
 */

import { useCallback } from 'react'
import { service } from '@axios'
import {
  ICommodityResult,
  IGlobalQuoteResult,
  IQuote,
  IQuoteTextResult,
} from '../types'
import {
  CN_HK_INDEX_CODES,
  CN_HK_INDEXES,
  COMMODITY_PRODUCTS,
  COMMODITY_PRODUCT_CODES,
  COMMODITY_QUOTE_API_URL,
  GLOBAL_INDEXES,
  GLOBAL_INDEX_SECIDS,
  GLOBAL_QUOTE_API_URL,
  QUOTE_API_URL,
} from '../constants'
import { arrangeByMeta, toNumber } from '../utils/format'
import {
  normalizeGlobalQuoteAt,
  parseCommodityItem,
  parseGlobalItem,
  parseIndexLine,
} from '../utils/parse'
import { IFeedSnapshot, IFeedState, useQuoteFeed } from './useQuoteFeed'

/** 行情数据源的公共入参 */
interface IFeedArgs {
  /** 是否为当前激活 Tab */
  enabled: boolean
  /** 基础轮询间隔（毫秒），0 表示当前阶段不轮询 */
  baseIntervalMs: number
  /** 时钟快照 */
  now: number
}

/** arrangeByMeta 的取键函数，三份清单共用 */
const keyOfQuote = (item: IQuote): string => item.id

/** 沪深港主要指数行情（服务端转发腾讯接口，原始文本按分号拆行） */
function useCnHkFeed(args: IFeedArgs): IFeedState {
  const { enabled, baseIntervalMs, now } = args
  const fetcher = useCallback(async (): Promise<IFeedSnapshot> => {
    const res = (await service({
      method: 'get',
      url: QUOTE_API_URL,
      params: { codes: CN_HK_INDEX_CODES },
    })) as IQuoteTextResult
    if (!res.success) {
      throw new Error(res.msg || '沪深港行情查询失败')
    }
    const lines: string[] = res.data
      .split(';')
      .filter((line: string) => line.trim().length > 0)
    // 响应到达时间：腾讯通道无服务端缓存，这个时刻就是本轮实时取数的时刻，供港股卡片判活跃
    const arrivedAt: number = Date.now()
    const parsedData: IQuote[] = lines
      .map((line: string) => parseIndexLine(line, arrivedAt))
      .filter((item: IQuote | null): item is IQuote => item !== null)
    return { list: arrangeByMeta(parsedData, CN_HK_INDEXES, keyOfQuote) }
  }, [])

  return useQuoteFeed({
    enabled,
    baseIntervalMs,
    now,
    fetcher,
    errorText: '沪深港行情暂不可用，请稍后重试',
    logTag: 'Fetch cn/hk index error:',
    // 腾讯通道文案沿用固定提示，不把服务端消息透到状态行
    serverMessageFirst: false,
  })
}

/** 国际主要指数行情（服务端转发东财，美股三大指数走腾讯兜底通道） */
function useGlobalFeed(args: IFeedArgs): IFeedState {
  const { enabled, baseIntervalMs, now } = args
  const fetcher = useCallback(async (): Promise<IFeedSnapshot> => {
    const res = (await service({
      method: 'get',
      url: GLOBAL_QUOTE_API_URL,
      params: { secids: GLOBAL_INDEX_SECIDS },
    })) as IGlobalQuoteResult
    if (!res.success || !Array.isArray(res.data)) {
      throw new Error(res.msg || '国际行情查询失败')
    }
    const parsedData: IQuote[] = normalizeGlobalQuoteAt(
      res.data
        .map(parseGlobalItem)
        .filter((item: IQuote | null): item is IQuote => item !== null)
    )
    return {
      list: arrangeByMeta(parsedData, GLOBAL_INDEXES, keyOfQuote),
      stale: res.stale === true,
      cachedAt: toNumber(res.cachedAt),
    }
  }, [])

  return useQuoteFeed({
    enabled,
    baseIntervalMs,
    now,
    fetcher,
    // 国际指数跨时区且上游按 IP 限流，改为手动刷新（不轮询），由页面刷新按钮触发
    autoPoll: false,
    // 取数结果存 sessionStorage，切回时直接复用（不限时），要最新数据由手动刷新触发
    cacheKey: 'global',
    errorText: '国际行情暂不可用，请稍后重试',
    logTag: 'Fetch global index error:',
  })
}

/** 大宗商品与外汇行情（服务端转发华尔街见闻行情数据中心） */
function useCommodityFeed(args: IFeedArgs): IFeedState {
  const { enabled, baseIntervalMs, now } = args
  const fetcher = useCallback(async (): Promise<IFeedSnapshot> => {
    const res = (await service({
      method: 'get',
      url: COMMODITY_QUOTE_API_URL,
      params: { prod_codes: COMMODITY_PRODUCT_CODES },
    })) as ICommodityResult
    if (!res.success || !Array.isArray(res.data)) {
      throw new Error(res.msg || '大宗商品行情查询失败')
    }
    const parsedData: IQuote[] = res.data
      .map(parseCommodityItem)
      .filter((item: IQuote | null): item is IQuote => item !== null)
    return {
      list: arrangeByMeta(parsedData, COMMODITY_PRODUCTS, keyOfQuote),
      stale: res.stale === true,
      cachedAt: toNumber(res.cachedAt),
    }
  }, [])

  return useQuoteFeed({
    enabled,
    baseIntervalMs,
    now,
    fetcher,
    // 大宗商品与外汇同样不轮询，改为手动刷新，避免长时间挂着高频定时器
    autoPoll: false,
    // 取数结果存 sessionStorage，切回时直接复用（不限时），要最新数据由手动刷新触发
    cacheKey: 'commodity',
    errorText: '大宗商品行情暂不可用，请稍后重试',
    logTag: 'Fetch commodity quote error:',
  })
}

export {
  IFeedArgs,
  useCnHkFeed,
  useGlobalFeed,
  useCommodityFeed,
}
