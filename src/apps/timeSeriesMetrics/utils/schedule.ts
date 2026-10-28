/**
 * 轮询间隔换算
 * 先由交易阶段得出基础间隔，再叠加行情活跃度纠偏，决定各看板实际轮询频率
 */

import { CN_HK_IDLE_REFRESH_MS, CN_HK_REFRESH_MS, QUOTE_IDLE_POLL_MS } from '../constants'
import { ActivityState, IBoardPhase } from './market'

/**
 * 依据沪深港市场所处的交易阶段给出行情轮询间隔（个股查询与沪深港指数共用）
 * @returns 轮询间隔毫秒数，0 表示该阶段无需轮询
 */
function getTradingIntervalMs(board: IBoardPhase): number {
  if (!board.active) {
    return 0
  }
  // 连续竞价阶段行情变动频繁，非连续竞价阶段（集合竞价、盘后）频率降低
  return board.phase === '盘中' ? CN_HK_REFRESH_MS : CN_HK_IDLE_REFRESH_MS
}

/**
 * 在阶段/固定节奏之上叠加行情活跃度，得出指数看板实际轮询间隔
 * 活跃度只用于纠偏，不抢主体调度：
 * - 该轮询但所有指数都停更（节假日、临时休市）→ 降为低频，不再空转
 * - 该停表但仍有指数在更新（时段模型过时或交易所有调整）→ 低频兜底，避免看不到新数据
 * - 时间戳不可判定（unknown）→ 完全沿用原有节奏
 * @param baseMs - 原有间隔，0 表示原计划不轮询
 * @param activity - 板块行情活跃状态
 * @returns 实际轮询间隔，0 表示不轮询
 */
function resolveIndexIntervalMs(baseMs: number, activity: ActivityState): number {
  if (activity === 'unknown') {
    return baseMs
  }
  if (activity === 'active') {
    return baseMs > 0 ? baseMs : QUOTE_IDLE_POLL_MS
  }
  return baseMs > 0 ? QUOTE_IDLE_POLL_MS : 0
}

export {
  getTradingIntervalMs,
  resolveIndexIntervalMs,
}
