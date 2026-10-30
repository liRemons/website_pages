/**
 * 资讯快讯骨架屏
 * 资讯是单列纵向流（每条一张毛玻璃卡片），不能用行情那套 CardSkeletonGrid（宽屏一行三列），
 * 否则骨架屏会排成一行三个、与真实布局不符造成跳动。这里逐条铺满整宽，并尽量贴近真实快讯结构：
 * 头部「时间 + 标签」小块、标题行、长短不一的正文行，减少数据到达前后的观感落差。
 */

import React from 'react'
import { Skeleton } from 'antd'
import style from '../styles/index.module.less'

interface INewsSkeletonProps {
  /** 占位条数 */
  count?: number
}

/** 默认铺 4 条，接近首屏可见条数，不至于过长 */
const DEFAULT_NEWS_SKELETON_COUNT = 4

/** 为第 index 条生成拟真的标题宽度与正文行宽，让长短错落、避免千篇一律 */
function skeletonShape(index: number): { title: string; lines: string[] } {
  // 正文行数在 2~3 间变化
  const lines: string[] =
    index % 3 === 0
      ? ['100%', '94%', '68%']
      : index % 2 === 0
        ? ['100%', '82%']
        : ['96%', '88%', '54%']
  const title: string = `${56 + ((index * 9) % 24)}%`
  return { title, lines }
}

function NewsSkeleton({
  count = DEFAULT_NEWS_SKELETON_COUNT,
}: INewsSkeletonProps): JSX.Element {
  return (
    <div className={style.newsSkeletonList}>
      {Array.from({ length: count }).map((_item: unknown, index: number) => {
        const shape = skeletonShape(index)
        return (
          <div className={style.newsSkeletonItem} key={index}>
            {/* 头部：时间 + 标签小条，模拟真实 newsHead 一行 */}
            <div className={style.newsSkeletonHead}>
              <Skeleton.Button active size="small" style={{ width: 56 }} />
              <Skeleton.Button active size="small" style={{ width: 34 }} />
            </div>
            {/* 标题行 + 长短不一的正文行 */}
            <Skeleton
              active
              title={{ width: shape.title }}
              paragraph={{ rows: shape.lines.length, width: shape.lines }}
            />
          </div>
        )
      })}
    </div>
  )
}

export { INewsSkeletonProps, NewsSkeleton }
