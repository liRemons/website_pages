/**
 * 卡片骨架屏栅格
 * 切到某个 Tab、该路尚无数据且在请求中时占位，与真实卡片用同一套响应式列宽与卡片外框，
 * 避免数据到达前出现空白跳动；列断点（xs 24 / lg 12 / xl 8）与 IndexCard、StockCard 保持一致
 */

import React from 'react'
import { Card, Col, Row, Skeleton } from 'antd'
import style from '../styles/index.module.less'

interface ICardSkeletonGridProps {
  /** 占位卡片数量 */
  count?: number
}

/** 默认铺 6 张，宽屏约两行、窄屏不会太长 */
const DEFAULT_SKELETON_COUNT = 6

function CardSkeletonGrid({
  count = DEFAULT_SKELETON_COUNT,
}: ICardSkeletonGridProps): JSX.Element {
  return (
    <Row gutter={[8, 8]}>
      {Array.from({ length: count }).map((_item: unknown, index: number) => (
        <Col xs={24} lg={12} xl={8} key={index}>
          <Card size="small" className={style.card}>
            <Skeleton active title={{ width: '56%' }} paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export { ICardSkeletonGridProps, CardSkeletonGrid }
