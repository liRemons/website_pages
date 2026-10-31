/**
 * 时钟快照 hook
 * 按固定步长推进一个时间戳；刷新对齐到「整点节拍」，用于需要秒级跳动又要求走时准确的场景（如顶部实时时钟 LiveClock）
 */

import { useEffect, useState } from 'react'

/**
 * 按固定步长推进、并对齐到节拍边界的时间戳
 * 做法：先等到下一个整点节拍（Date.now() 对 tickMs 取模的余数补满）触发一次，之后每轮重新算到下个边界的延时
 * 好处：① 秒数在真实进位那一刻刷新，不会像 setInterval 那样与秒边界错开、最多慢近 1 秒；② 每轮重算延时，不会随时间累积漂移
 * @param tickMs - 时钟步长（毫秒），取自 CLOCK_LIVE_TICK_MS
 * @returns 上一次节拍触发时的时间戳
 */
function useClock(tickMs: number): number {
  const [clock, setClock] = useState<number>(() => Date.now())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const scheduleTick = (): void => {
      const delay: number = tickMs - (Date.now() % tickMs)
      timer = setTimeout(() => {
        setClock(Date.now())
        scheduleTick()
      }, delay)
    }
    scheduleTick()
    return (): void => {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
    }
  }, [tickMs])
  return clock
}

export {
  useClock,
}
