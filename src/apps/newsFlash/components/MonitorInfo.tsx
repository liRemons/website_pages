/**
 * 状态行
 * 与监控页（timeSeriesMetrics）各看板那一条状态行同结构同样式，两页各自一份，互不引用：
 * 左侧操作区（只看重要 + 日期 + 手动刷新）+ 状态文案。
 * 字号、颜色、间距、排序只由 .monitorInfo 一处定义，看板不自己覆盖或另起结构，
 * 否则同一条状态行在不同场景下的外边距与控件顺序会各走一套
 */

import React, { memo } from 'react'
import style from '../styles/index.module.less'

interface IMonitorInfoProps {
  /** 左侧操作区，如手动刷新按钮、「只看重要 + 日期」；不传则只有文案 */
  leading?: React.ReactNode
  /** 状态文案，空串不渲染（首次进入还没有数据时不占位） */
  text?: string
  /** 文案附加类名，供个别看板做窄屏隐藏这类差异处理 */
  textClassName?: string
}

const MonitorInfo = memo(function MonitorInfo({
  leading,
  text = '',
  textClassName,
}: IMonitorInfoProps): JSX.Element | null {
  // 既无操作区也无文案（首次进入还没拿到数据）时整行不渲染，避免白占一条外边距
  if (!leading && !text) {
    return null
  }
  const textClass: string = textClassName
    ? `${style.monitorInfoText} ${textClassName}`
    : style.monitorInfoText
  return (
    <div className={style.monitorInfo}>
      {leading ? <div className={style.monitorInfoLeading}>{leading}</div> : null}
      {text ? <span className={textClass}>{text}</span> : null}
    </div>
  )
})

export { IMonitorInfoProps, MonitorInfo }
