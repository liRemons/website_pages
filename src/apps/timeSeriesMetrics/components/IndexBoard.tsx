/**
 * 指数看板
 * 汇总状态行文案，按市场切分段落并铺卡片，沪深港、其他市场、大宗商品三个 Tab 共用
 */

import React from 'react'
import { Col, Row } from 'antd'
import { IQuote } from '../types'
import { IndexCard } from './IndexCard'
import { CardSkeletonGrid } from './CardSkeletonGrid'
import { ActivityState, getQuoteStatus } from '../utils/market'
import style from '../styles/index.module.less'

/** 指数看板的展示段落 */
interface IIndexSection {
  /** 市场名表头，空串表示整页只有一块、无需表头 */
  label: string
  list: IQuote[]
}

/** 多个单一指数市场合并成一段时的表头市场名 */
const OTHER_MARKET_LABEL = '其他市场'

/**
 * 按市场切分指数列表
 * 同一市场的指数不少于 2 个时，该市场单独成段并带上市场名表头（如「美股」下的道琼斯/标普500/纳斯达克）；
 * 只有一个指数的市场合并为一段，同样带「其他市场」表头，避免跟在前一个市场名后面被误读为该市场的一部分
 * @param list - 已按清单顺序排序的指数行情
 * @returns 待逐段渲染的展示段落
 */
function buildMarketSections(list: IQuote[]): IIndexSection[] {
  // 按首次出现顺序聚合各市场的指数
  const marketOrder: string[] = []
  const bucketMap: Map<string, IQuote[]> = new Map()
  list.forEach((quote: IQuote) => {
    const bucket: IQuote[] | undefined = bucketMap.get(quote.marketLabel)
    if (bucket) {
      bucket.push(quote)
    } else {
      bucketMap.set(quote.marketLabel, [quote])
      marketOrder.push(quote.marketLabel)
    }
  })

  const sections: IIndexSection[] = []
  // 单一市场先攒着，遇到需要单独成行的市场再落地
  let pending: IQuote[] = []
  marketOrder.forEach((label: string) => {
    const bucket: IQuote[] = bucketMap.get(label) || []
    if (bucket.length < 2) {
      pending = pending.concat(bucket)
      return
    }
    if (pending.length) {
      sections.push({ label: OTHER_MARKET_LABEL, list: pending })
      pending = []
    }
    sections.push({ label, list: bucket })
  })
  if (pending.length) {
    sections.push({ label: OTHER_MARKET_LABEL, list: pending })
  }
  // 没有任何多指数市场时，加「其他市场」表头无意义，退化为不带表头的一整块
  if (sections.length === 1 && sections[0].label === OTHER_MARKET_LABEL) {
    return [{ label: '', list: sections[0].list }]
  }
  return sections
}

/** 指数看板属性 */
interface IIndexBoardProps {
  list: IQuote[]
  loading: boolean
  /** 刷新状态文案，如「自动刷新中...」 */
  refreshLabel: string
  /** 数据拉取失败时的提示，空串表示无异常 */
  errorText: string
  /** 是否按市场分组成行（同一市场指数 ≥ 2 个时单独起一行） */
  groupedByMarket?: boolean
  /** 当前时间毫秒时间戳，逐指数判断是否仍在交易 */
  now: number
  /** 板块行情活跃状态，用于汇总文案与说明轮询降频原因 */
  activity: ActivityState
  /** 右侧操作区（如手动刷新按钮），不传则仅展示状态文案 */
  refreshAction?: React.ReactNode
}

/**
 * 指数看板
 * 顶部为数量与刷新状态提示，下方为卡片栅格
 */
function IndexBoard({
  list,
  loading,
  refreshLabel,
  errorText,
  groupedByMarket = false,
  now,
  activity,
  refreshAction,
}: IIndexBoardProps): JSX.Element {
  // 已有数据时轮询不打断阅读，仅在完全没数据且请求中时提示加载中
  const loadingText: string =
    list.length === 0 && loading ? '行情加载中...' : refreshLabel
  // 无任何数据且在请求中：先铺骨架屏占位，避免数据到达前的空白跳动
  const showSkeleton: boolean = list.length === 0 && loading
  // 活跃指数数量；上游没给可靠行情时间（unknown）时不报数，避免误显示成「0 个在更新」
  const activeCount: number = list.filter(
    (quote: IQuote) => getQuoteStatus(quote.quoteAt, now) === '更新中'
  ).length
  const activityText: string =
    activity === 'unknown' || list.length === 0
      ? ''
      : ` | ${activeCount}/${list.length} 个行情在更新`
  const infoText: string = errorText
    ? errorText
    : showSkeleton
    ? loadingText
    : `共 ${list.length} 个指数${activityText} | ${loadingText}`
  const sections: IIndexSection[] = groupedByMarket
    ? buildMarketSections(list)
    : [{ label: '', list }]

  return (
    <>
      <div className={style.monitorInfo}>
        {refreshAction && <span className={style.infoAction}>{refreshAction}</span>}
        <span>{infoText}</span>
      </div>
      {showSkeleton ? (
        <CardSkeletonGrid />
      ) : (
        sections.map((section: IIndexSection, index: number) => (
          <div className={style.marketSection} key={`section-${index}`}>
            {!!section.label && (
              <div className={style.marketGroupTitle}>{section.label}</div>
            )}
            <Row gutter={[8, 8]}>
              {section.list.map((quote: IQuote) => (
                <Col xs={24} lg={12} xl={8} key={quote.id}>
                  <IndexCard quote={quote} now={now} />
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}
    </>
  )
}

export {
  IIndexSection,
  OTHER_MARKET_LABEL,
  buildMarketSections,
  IIndexBoardProps,
  IndexBoard,
}
