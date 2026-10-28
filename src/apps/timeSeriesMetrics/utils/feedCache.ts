/**
 * 行情结果的前端缓存（sessionStorage）
 * 供不轮询的手动刷新 Tab（其他市场 / 大宗商品）复用：
 * 取数成功后落一份带时间戳的快照，切回该 Tab 直接命中缓存渲染、不穿透服务端（要最新数据由手动刷新触发）。
 * 与 localStorage 的用户偏好分开存，键统一加 tsm_feed_ 前缀，读写全部包 try 兜住隐私模式与配额异常
 */

import { IQuote } from '../types'

/** 一份行情快照在 sessionStorage 中的存储结构 */
interface IFeedCacheEntry {
  /** 已按清单顺序重排的行情列表 */
  data: IQuote[]
  /** 该份数据是否为服务端回退的旧数据 */
  stale: boolean
  /** 服务端回退数据的取回时间（毫秒），无则为 0 */
  cachedAt: number
  /** 写入本地的时刻（毫秒），用于前端 TTL 判定 */
  at: number
}

/** 缓存键前缀，与用户偏好、股票代码等 localStorage 键隔离 */
const FEED_CACHE_PREFIX = 'tsm_feed_'

/** 存储是否可用（隐私模式或老引擎禁用 sessionStorage 时读写均静默降级） */
function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.sessionStorage
  } catch (error) {
    return false
  }
}

/**
 * 读取指定键的行情缓存
 * @param key - 缓存子键（各数据源用自己的标识）
 * @param ttlMs - 有效期（毫秒），超过即视为失效并顺手清除
 * @returns 命中的快照，未命中/过期/异常返回 null
 */
function readFeedCache(key: string, ttlMs: number): IFeedCacheEntry | null {
  if (!key || !storageAvailable()) {
    return null
  }
  try {
    const raw: string | null = window.sessionStorage.getItem(FEED_CACHE_PREFIX + key)
    if (!raw) {
      return null
    }
    const entry: IFeedCacheEntry = JSON.parse(raw) as IFeedCacheEntry
    if (!entry || !Array.isArray(entry.data) || !Number.isFinite(entry.at)) {
      return null
    }
    // 过期即清除，避免下次再解析一份废数据
    if (Date.now() - entry.at > ttlMs) {
      window.sessionStorage.removeItem(FEED_CACHE_PREFIX + key)
      return null
    }
    return entry
  } catch (error) {
    return null
  }
}

/**
 * 写入行情缓存
 * @param key - 缓存子键
 * @param entry - 待缓存的快照（不含 at，由本函数盖为当前时刻）
 */
function writeFeedCache(
  key: string,
  entry: { data: IQuote[]; stale: boolean; cachedAt: number }
): void {
  if (!key || !storageAvailable()) {
    return
  }
  try {
    window.sessionStorage.setItem(
      FEED_CACHE_PREFIX + key,
      JSON.stringify({ ...entry, at: Date.now() })
    )
  } catch (error) {
    // 配额写满等情况不影响行情展示，静默忽略
  }
}

export {
  IFeedCacheEntry,
  readFeedCache,
  writeFeedCache,
}
