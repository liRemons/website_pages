/**
 * 手动刷新按钮
 * 用于不轮询的资讯快讯：点击进入 30 秒倒计时，
 * 倒计时内禁用，避免高频点击穿透上游（见闻接口按 IP 限流）；
 * 倒计时与在途请求都会反映到按钮文案，给用户明确的节奏反馈
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import style from '../styles/index.module.less'

interface IRefreshButtonProps {
  /** 触发一次取数，返回 Promise 以便按钮等待请求结束后再进入下一轮可点状态 */
  onRefresh: () => Promise<unknown> | void
  /** 禁用倒计时（毫秒），默认 30 秒 */
  cooldownMs?: number
}

/** 倒计时每跳一次的间隔（毫秒） */
const TICK_MS = 1000

function RefreshButton({
  onRefresh,
  cooldownMs = 30 * 1000,
}: IRefreshButtonProps): JSX.Element {
  // 剩余禁用毫秒，0 表示可点击
  const [remainMs, setRemainMs] = useState<number>(0)
  const [busy, setBusy] = useState<boolean>(false)
  // 卸载时清掉倒计时，避免对已卸载组件 setState
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (remainMs <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = setInterval(() => {
      setRemainMs((prev: number) => Math.max(0, prev - TICK_MS))
    }, TICK_MS)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [remainMs])

  const handleClick = useCallback(async (): Promise<void> => {
    // 倒计时未结束或上一次请求仍在途中，忽略点击
    if (remainMs > 0 || busy) {
      return
    }
    setBusy(true)
    try {
      await onRefresh()
    } finally {
      setBusy(false)
    }
    // 请求返回后才开始倒计时，保证「点击即取数」与「取数后冷却」两段体验都可见
    setRemainMs(cooldownMs)
  }, [busy, cooldownMs, onRefresh, remainMs])

  const cooling: boolean = remainMs > 0
  const seconds: number = Math.ceil(remainMs / 1000)
  const label: string = busy
    ? '刷新中...'
    : cooling
    ? `${seconds} 秒后可刷新`
    : '刷新'

  // 统一用文字版：普通 span，保留主色文字与手型；刷新中/倒计时处于禁用态时不可点、置灰
  const disabled: boolean = busy || cooling
  return (
    <span
      className={disabled ? `${style.refreshText} ${style.refreshTextDisabled}` : style.refreshText}
      onClick={handleClick}
    >
      <ReloadOutlined spin={busy} />
      {label}
    </span>
  )
}

export { IRefreshButtonProps, RefreshButton }
