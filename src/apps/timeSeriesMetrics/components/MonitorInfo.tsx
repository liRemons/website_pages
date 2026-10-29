/**
 * 状态行
 * 个股 / 沪深港 / 其他市场 / 大宗商品看板共用的一条状态提示：
 * 左侧操作区（手动刷新）+ 状态文案。
 * 字号、颜色、间距、排序只由 .monitorInfo 一处定义，各看板不再自己覆盖或另起结构，
 * 否则同一条状态行在不同 Tab 下的外边距与控件顺序会各走一套
 */

import React, { memo } from 'react'
import style from '../styles/index.module.less'

interface IMonitorInfoProps {
  /** 左侧操作区，如手动刷新按钮；不传则只有文案 */
  leading?: React.ReactNode
  /** 状态文案，空串不渲染（首次进入还没有数据时不占位） */
  text?: string
}

const MonitorInfo = memo(function MonitorInfo({
  leading,
  text = '',
}: IMonitorInfoProps): JSX.Element | null {
  // 既无操作区也无文案（首次进入还没拿到数据）时整行不渲染，避免白占一条外边距
  if (!leading && !text) {
    return null
  }
  return (
    <div className={style.monitorInfo}>
      {leading ? <div className={style.monitorInfoLeading}>{leading}</div> : null}
      {text ? <span className={style.monitorInfoText}>{text}</span> : null}
    </div>
  )
})

export { IMonitorInfoProps, MonitorInfo }
