/**
 * 顶部实时时钟：日期 + 星期 + 按 1 秒节拍持续跳动的时间（YYYY-MM-DD 周X HH:mm:ss）
 * 单独做成叶子组件，是为了让每秒的重渲染只发生在这里，
 * 不牵动持有整条列表的 NewsBoard（列表条目多、带配图，每秒整体重渲染代价太大）
 */

import React, { memo } from 'react'
import { CLOCK_LIVE_TICK_MS } from '../constants'
import { useClock } from '../hooks/useClock'
import { formatNewsDate, formatNewsTime } from '../utils/format'

const LiveClock = memo(function LiveClock(): JSX.Element {
  const now: number = useClock(CLOCK_LIVE_TICK_MS)
  // 只回文本，由父级 .newsDateHeader 提供外层与样式，不额外包节点
  // 日期/星期与走秒时间同源于这个 1 秒时钟（跨零点会自动换新一天，不再依赖滚动锚点）
  return <>{`${formatNewsDate(now)} ${formatNewsTime(now)}`}</>
})

export { LiveClock }
