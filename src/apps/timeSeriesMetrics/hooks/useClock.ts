/**
 * 时钟快照 hook
 * 页面长时间打开时（无人操作、不重新请求）也能感知盘前→开盘→午间→盘后→收盘的切换
 */

import { useEffect, useState } from 'react'

/**
 * 按固定步长推进的时间戳
 * @param tickMs - 时钟步长（毫秒），取自 CLOCK_TICK_MS
 * @returns 当前时间戳，用于时段判定与行情活跃度判定
 */
function useClock(tickMs: number): number {
  const [clock, setClock] = useState<number>(() => Date.now())
  useEffect(() => {
    const ticker = setInterval(() => setClock(Date.now()), tickMs)
    return () => clearInterval(ticker)
  }, [tickMs])
  return clock
}

export {
  useClock,
}
