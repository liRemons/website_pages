/**
 * 单个指数/品种卡片
 * 展示价格与关键指标，并给出时段标识（盘前/盘中/午休/盘后/休市）与数据标识（更新中/已停更）
 */

import React, { memo } from 'react'
import { Card, Statistic, Tag, Tooltip, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import { IQuote } from '../types'
import { INDEX_CHANGE_FONT_SIZE, INDEX_PRICE_FONT_SIZE, MARKET_SESSIONS } from '../constants'
import { displayCode, fmt } from '../utils/format'
import { ISessionState, QuoteStatus, getMarketSession, getQuoteStatus } from '../utils/market'
import style from '../styles/index.module.less'
const { Title, Text } = Typography

/** 指数卡片属性 */
interface IIndexCardProps {
  quote: IQuote
  /** 当前时间毫秒时间戳，用于判断该指数行情是否仍在更新 */
  now: number
}

/**
 * 单个指数卡片
 * 指数无五档盘口、换手率、量比、市值等数据，只展示价格相关字段
 * 用 memo 包住：切 Tab / 其它数据源更新都会让页面重渲染，
 * 只有自己拿到的 quote 或时钟 now 变了才需要重算时段与数据标识
 */
const IndexCard = memo(function IndexCard({ quote, now }: IIndexCardProps): JSX.Element {
  // 小数位：指数默认 2 位，大宗商品/外汇按上游逐品种给的精度（外汇 4 位、天然气 3 位），
  // 否则 1.112 会被截成 1.11、完全看不出波动
  const digits: number = quote.precision && quote.precision > 0 ? quote.precision : 2
  // 时段标识：交易所官方时段（盘前/盘中/午休/盘后/休市），按市场当地时区算，夏令时自动跟随
  const session: ISessionState | null = getMarketSession(
    MARKET_SESSIONS[quote.sessionKey],
    new Date(now)
  )
  // 进行中时段用主题色，盘前盘后等边缘时段用橙色，休市用置灰文字
  const sessionClass: string = session
    ? session.phase === '盘中'
      ? style.sessionLive
      : session.phase === '休市'
      ? style.sessionOff
      : style.sessionEdge
    : ''
  // 数据标识：不依赖时段表，直接看行情时间新不新（港股的 quoteAt 已是本轮到达时间）
  const status: QuoteStatus = getQuoteStatus(quote.quoteAt, now)
  // 源时间滞后的品种（港股）在悬停里带出滞后事由，避免用户拿展示时间去对账
  const statusTip: string =
    status === '更新中'
      ? `行情仍在更新，最后行情时间 ${quote.updateTime}${quote.timeLagNote || ''}`
      : status === '已停更'
      ? `行情已停更，当前展示的是 ${quote.updateTime} 的数据（休市、停牌或数据源异常）`
      : '上游未返回行情时间，无法判断数据是否在更新'
  // 无法判定时间来源时不打标，宁可没有标识也不要误标成「更新中」
  const statusTag: JSX.Element | null =
    status === '未知' ? null : (
      <Tooltip title={statusTip}>
        <Tag
          color={status === '更新中' ? 'success' : 'default'}
          className={style.statusTag}
        >
          {status}
        </Tag>
      </Tooltip>
    )
  const sessionTag: JSX.Element | null = session ? (
    <Tooltip title={session.text}>
      <Tag className={`${style.sessionTag} ${sessionClass}`}>{session.phase}</Tag>
    </Tooltip>
  ) : null

  return (
    <Card
      size="small"
      className={style.card}
      title={
        <div className={style.cardTitle}>
          <span>
            <Tag color="blue" className={style.marketTag}>
              {quote.marketLabel}
            </Tag>
            <span className={style.stockName}>{quote.name}</span>
            {sessionTag}
            {statusTag}
          </span>
          <Text type="secondary" className={style.indexCode}>
            {displayCode(quote.code)}
          </Text>
        </div>
      }
    >
      {/* 更新时间 */}
      <Text
        type="secondary"
        className={style.updateTime}
        style={{ display: 'block', marginBottom: 8 }}
      >
        {quote.updateTime}
      </Text>
      {/* 关键指标 */}
      <div className={`${style.gridContainer} ${style.indexGrid}`}>
        {/* 最新价 & 涨跌幅 */}
        <div className={style.priceRow}>
          <Title
            level={2}
            className={style.priceTitle}
            style={{ color: quote.color, fontSize: INDEX_PRICE_FONT_SIZE }}
          >
            {fmt(quote.price, digits)}
          </Title>
          <Statistic
            value={quote.changePct}
            precision={2}
            suffix="%"
            valueStyle={{
              color: quote.color,
              fontSize: INDEX_CHANGE_FONT_SIZE,
              marginLeft: 12,
            }}
            prefix={
              quote.isUp ? (
                <ArrowUpOutlined />
              ) : quote.isFlat ? (
                <MinusOutlined />
              ) : (
                <ArrowDownOutlined />
              )
            }
          />
          <Text className={style.changeAmt} style={{ color: quote.color }}>
            {quote.changeAmt > 0 ? '+' : ''}
            {fmt(quote.changeAmt, digits)}
          </Text>
        </div>
        {/* 今开价 */}
        <div>
          <Text type="secondary">今开</Text>
          <br />
          {fmt(quote.stats.open, digits)}
        </div>
        {/* 最低价 - 最高价 */}
        <div>
          <Text type="secondary">最低/最高</Text>
          <br />
          {fmt(quote.stats.low, digits)} - {fmt(quote.stats.high, digits)}
        </div>
        {/* 昨收价 */}
        <div>
          <Text type="secondary">昨收</Text>
          <br />
          {fmt(quote.stats.preClose, digits)}
        </div>
      </div>
    </Card>
  )
})

export {
  IIndexCardProps,
  IndexCard,
}
