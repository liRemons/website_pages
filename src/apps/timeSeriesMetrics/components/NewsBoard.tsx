/**
 * 资讯快讯看板
 * 用 antd List 渲染时间倒序的快讯，底部放一个哨兵元素配合 IntersectionObserver 实现「滚到底加载下一页」
 * （antd v5 未提供 InfiniteScroll 组件，这里用原生观察器即可，不引额外依赖）。
 * 顶部状态行复用手动刷新按钮；长连接推送的新快讯在列表头部插入并给出「回到最新」提示条；
 * 用户不在顶部时置顶插入会自动做滚动补偿（滚动条补回新增高度，原画面内容不漂移）。
 * 状态行的日期星期跟在刷新按钮后：取视口中部偏上位置条目所属日期，随滚动与跨零点更新，
 * 窄屏下该位置优先保留日期、隐藏长状态文案（省屏效）；日期只在这一行给出，列表条目只显示时刻。
 * 状态行与新快讯提示条：前者整块吸顶，后者浮在吸顶头下沿（绝对定位、不占位），
 * 提示条出现与消失不会推下列表内容，也不影响固定区高度。
 * 带 calendar_key 的条目在正文标题左侧展示国旗 icon，正文下方展示经济数据指标行（国家 + 今值/预期/前值，指标由 useNewsFeed 拉取）；
 * 带 article 的条目在条目最下方展示「相关文章」蓝色链接入口，点击新标签页打开原文 uri。
 * 条目布局：宽屏定宽时间列在左（只有时刻 HH:mm）、内容区在右，中间虚线分隔；
 * 窄屏（≤576px）隐藏时间列，时刻拼在正文 HTML 前与标题同排，不再单独占一行；
 * 国旗 icon 行内拼在正文 HTML 前与标题同排。
 * 弹窗（快讯详情）不走这一套：标题放在弹窗头部（无标题时回退「快讯详情」），
 * 时间放在标题下方独立一行（带年/日期/星期），正文不再带【标题】前缀，也不渲染左侧时刻列。
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { List, Skeleton, Button, Image, Modal, Checkbox } from 'antd'
import { ArrowUpOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import { INewsCalendar, INewsItem } from '../types'
import { COLOR_UP } from '../constants'
import { formatNewsClock, formatNewsDate } from '../utils/format'
import { buildExcerptHtml, calendarKeyOf, formatCalendarValue, sanitizeNewsHtml } from '../utils/news'
import { RefreshButton } from './RefreshButton'
import { NewsSkeleton } from './NewsSkeleton'
import style from '../styles/index.module.less'

interface INewsBoardProps {
  items: INewsItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  /** 加载失败文案，空串表示正常 */
  error: string
  /** 新推送条数，大于 0 时展示「回到最新」提示条 */
  newCount: number
  /** calendarKey|calendarType -> 财经日历指标（今值/预期/前值/国旗），由 useNewsFeed 拉取 */
  calendarData: Record<string, INewsCalendar>
  /** 只看「重要」：勾选后只展示 score=2 的快讯 */
  importantOnly: boolean
  /** 切换「只看重要」 */
  onToggleImportant: (checked: boolean) => void
  /** 页面时钟快照：列表还没数据（首屏/骨架/空列表）时顶部日期的回退基准，跨零点自动换成昨天 */
  now: number
  onLoadMore: () => void
  onRefresh: () => Promise<void> | void
  onAckNew: () => void
}

/** 哨兵进入视口提前多少像素即触发加载 */
const ROOT_MARGIN = '0px 0px 240px 0px'

/** 判定「在顶部」的滚动阈值（像素）： scrollTop 小于等于此值视为已置顶 */
const AT_TOP_THRESHOLD = 40

/** 顶部日期行锚点：取视口高度 40% 处（中部偏上）的条目日期作为当前日期 */
const DATE_ANCHOR_RATIO = 0.4

/** 从给定节点向上找最近的可滚动祖先（真正的滚动容器，本页为 .ant-tabs-content-holder） */
function findScroller(from: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = from
  while (node) {
    const overflowY: string = window.getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node
    }
    node = node.parentElement
  }
  return null
}

function NewsBoard({
  items,
  loading,
  loadingMore,
  hasMore,
  error,
  newCount,
  calendarData,
  importantOnly,
  now,
  onToggleImportant,
  onLoadMore,
  onRefresh,
  onAckNew,
}: INewsBoardProps): JSX.Element {
  // 列表顶部锚点，点击「新快讯」时滚到这里
  const topRef = useRef<HTMLDivElement | null>(null)
  // 底部哨兵，被观察即代表触底
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // 是否处于列表顶部附近：在顶部时新推送已直接可见，无需「N 条新快讯」提示
  const [atTop, setAtTop] = useState<boolean>(true)
  // 上一轮渲染的滚动位置、内容总高、首条 id 与条目数，用于新快讯置顶后的滚动补偿
  const scrollPosRef = useRef<number>(0)
  const prevScrollHeightRef = useRef<number>(0)
  const prevFirstIdRef = useRef<number | null>(null)
  const prevCountRef = useRef<number>(0)
  // 点击正文（超 3 行被截断）后弹窗展示全部内容的当前条目
  const [active, setActive] = useState<INewsItem | null>(null)
  // 状态行日期锚点：视口中部偏上条目所属日期（毫秒时间），随滚动/换页/时钟更新
  const [headerDateMs, setHeaderDateMs] = useState<number>(now)
  // 页面时钟快照的 ref 镜像：锚点回退基准用，避免每秒时钟刷新重建滚动监听
  const nowRef = useRef<number>(now)
  nowRef.current = now
  const openDetail = useCallback((item: INewsItem): void => { setActive(item) }, [])
  const closeDetail = useCallback((): void => { setActive(null) }, [])
  // content_more 可能很短，保留行内展开/收起；与「正文超长走弹窗」并存
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const toggleExpand = useCallback((id: number): void => {
    setExpandedIds((prev: Set<number>) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 哨兵进入视口就请求下一页；依赖列表长度与加载态，保证状态变化后重新绑定
  useEffect(() => {
    const node: HTMLDivElement | null = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      return
    }
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0] && entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: ROOT_MARGIN }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [onLoadMore, items.length, loadingMore, hasMore])

  // 监听滚动容器维护「是否在顶部」与状态行日期锚点；容器需挂载后才能取到，故用 effect 绑定
  useEffect(() => {
    const scroller: HTMLElement | null = findScroller(topRef.current)
    const target: HTMLElement | Window = scroller || window
    // 回退基准从 nowRef 读取：不随每秒时钟重建监听；列表滚到另一天的旧条目时（滚动/翻页/新快讯置顶）重算会带出那个日期
    const syncHeaderDate = (): void => {
      const y: number = window.innerHeight * DATE_ANCHOR_RATIO
      // 只查本组件容器内的条目：弹窗也复用 renderBody（带同样的 data-news-ts），不能全局查
      const container: HTMLElement | null = topRef.current
      if (!container) {
        return
      }
      const nodes = container.querySelectorAll<HTMLElement>('[data-news-ts]')
      let picked: number | null = null
      for (let i = 0; i < nodes.length; i += 1) {
        const { top } = nodes[i].getBoundingClientRect()
        // 逐条往后推，留下的最后一条就是跨过锚点（顶部不高于锚点）的那条
        if (top <= y) {
          picked = Number(nodes[i].getAttribute('data-news-ts'))
        }
      }
      // 条目没铺到锚点（列表很短）时用首条；完全滑过锚点（不应发生）也走上面的逆推结果
      if (picked === null && nodes.length > 0) {
        picked = Number(nodes[0].getAttribute('data-news-ts'))
      }
      if (picked !== null && Number.isFinite(picked)) {
        setHeaderDateMs(picked)
      } else {
        // 列表空或骨架屏阶段回退跟随页面时钟
        setHeaderDateMs(nowRef.current)
      }
    }
    const onScroll = (): void => {
      const top: number = scroller ? scroller.scrollTop : window.scrollY
      setAtTop(top <= AT_TOP_THRESHOLD)
      syncHeaderDate()
    }
    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', syncHeaderDate)
    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', syncHeaderDate)
    }
  }, [items.length, loading, loadingMore])

  /**
   * 新快讯置顶后的滚动补偿：SSE 推送把条目插到列表头部时，DOM 总高度增加而 scrollTop 不变，
   * 视口内容会被向下顶（用户正在下方阅读时表现为跳动）。
   * useLayoutEffect 在 DOM 变更同步完成后、浏览器绘制前执行：此时新增条目尚未绘制、
   * 折叠状态与图片占位稳定，把 scrollTop 补回「原位置 + 新增高度」即与原屏幕完全一致。
   * 仅在「条目数变多且首条 id 变了」= 头部插入时触发；触底翻页是尾部追加、首屏/筛选替换整列表，都不补。
   */
  useLayoutEffect(() => {
    const scroller: HTMLElement | null = findScroller(topRef.current)
    if (scroller) {
      const firstId: number | null = items.length > 0 ? items[0].id : null
      const prepended: boolean =
        prevFirstIdRef.current !== null &&
        firstId !== null &&
        firstId !== prevFirstIdRef.current &&
        items.length > prevCountRef.current
      if (prepended) {
        // 用滚动容器内容总高度差近似新增条目的总高度（尾部追加不会同时发生，互不干扰）
        const delta: number = scroller.scrollHeight - prevScrollHeightRef.current
        if (delta > 0 && scroller.scrollTop > AT_TOP_THRESHOLD) {
          scroller.scrollTop += delta
        }
      }
      prevScrollHeightRef.current = scroller.scrollHeight
      prevFirstIdRef.current = firstId
      prevCountRef.current = items.length
      scrollPosRef.current = scroller.scrollTop
    }
  }, [items])

  // 处于顶部且有未读计数时直接清空：条目已在视野内可见，不必再提示
  useEffect(() => {
    if (atTop && newCount > 0) {
      onAckNew()
    }
  }, [atTop, newCount, onAckNew])

  const handleBackToNew = useCallback((): void => {
    const el: HTMLDivElement | null = topRef.current
    // scrollIntoView 对内层滚动容器不一定生效，显式把最近可滚动祖先的 scrollTop 归零
    const scroller: HTMLElement | null = findScroller(el)
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onAckNew()
  }, [onAckNew])

  const statusText: string = error
    ? error
    : '实时快讯 · 进入自动加载，下滑翻页，新推送将出现在顶部'

  // 列表条目与弹窗共用的正文渲染（两者布局不同，由 clamped 分支）：
  // 列表：宽屏左右两栏（时刻列在左垂直居中、内容区在右、中间虚线分隔），窄屏时刻改为正文前的
  // 行内前缀（不再单独占一行，屏效）；日期只在看板顶部状态行
  // 弹窗：不渲染时刻列，也不在正文里重复标题，改为弹窗头部显示标题 + 标题下方一行日期时刻
  // （经济数据指标行、展开补充、配图、相关文章始终跟正文同栏；重要/新标记已去掉）
  // clamped=true：正文最多 3 行截断、点击弹窗、鼠标手型；clamped=false：弹窗内展示全文、不再响应点击
  const renderBody = (item: INewsItem, clamped: boolean): JSX.Element => {
    // 条目带 calendar_key 且指标已拉到时渲染指标行；未拉到/失败则不展示（不占位）
    const calendar: INewsCalendar | undefined = calendarData[calendarKeyOf(item)]
    // 条目只留时刻：日期不在每条上重复，整列的日期语义由顶部状态行统一给出（跨零点的旧条目也一样，
    // 滚动到它们时状态行会换成对应日期），省屏效也让时间列宽度稳定
    const timeText: string = formatNewsClock(item.displayTime)
    return (
    <div className={style.newsBody}>
      {/* 左栏时刻列只在列表出现（定宽、只到分、数字等宽）；score=2 重要快讯与正文同样标红；
          窄屏整体隐藏，换成正文前的 .newsTimeInline 行内前缀；弹窗内这一列换成标题下方的时间行 */}
      {clamped ? (
        <div
          className={style.newsTimeCol}
          style={item.score === 2 ? { color: COLOR_UP } : undefined}
        >
          <div className={style.newsTimeClock}>{timeText}</div>
        </div>
      ) : null}
      <div className={clamped ? style.newsMain : `${style.newsMain} ${style.newsMainFlush}`}>
        {/* 弹窗：标题已提到弹窗头部，这里在标题下方补一行完整时间（年+日期+星期+时刻）；
            带上日期是因为弹窗已脱离看板顶部那条日期状态行，只剩时刻会看不出是哪一天 */}
        {clamped ? null : (
          <div className={style.newsDetailTime}>{`${formatNewsDate(item.displayTime)} ${timeText}`}</div>
        )}
      {/* 正文：国旗、标题前缀、清洗后的正文 HTML、「展开」开关拼成单一行内流，一次 innerHTML 注入。
          必须同段注入：.newsExcerpt 是 -webkit-box（行夹叠），且正文常以 <p> 等块级标签开头，
          拆开渲染时块级正文会切出独立行盒，把行外的国旗挤成独占一行（display: contents 包装在 Chromium 下同样不可靠）；
          开关用 data-toggle-id 标记，在 capture 阶段事件委托处理；正文内链接同阶段拦截开新页；点击正文弹窗看全文；score=2 标红 */}
      <div
        className={clamped ? style.newsExcerpt : style.newsExcerptFull}
        style={item.score === 2 ? { color: COLOR_UP } : undefined}
        onClick={clamped ? () => openDetail(item) : undefined}
        onClickCapture={(e: React.MouseEvent): void => {
          const toggle: HTMLElement | null = (e.target as HTMLElement).closest('[data-toggle-id]')
          if (toggle) {
            // 展开/收起：阻止冒泡，避免点开关连带触发正文的「打开弹窗」
            e.preventDefault()
            e.stopPropagation()
            toggleExpand(Number(toggle.getAttribute('data-toggle-id')))
            return
          }
          const anchor: HTMLAnchorElement | null = (e.target as HTMLElement).closest('a')
          if (anchor && anchor.href && anchor.href !== '#') {
            e.preventDefault()
            e.stopPropagation()
            window.open(anchor.href, '_blank')
          }
        }}
        dangerouslySetInnerHTML={{
          __html: buildExcerptHtml({
            // 行内时刻只给窄屏列表（宽屏由样式隐藏，时间走左侧定宽列）；弹窗已有标题下方的时间行，不再拼前缀
            timeLabel: clamped ? timeText : '',
            timeClass: style.newsTimeInline,
            flagUri: calendar ? calendar.flagUri : '',
            flagClass: style.newsFlag,
            // 标题只在列表正文里加【】前缀；弹窗内提到弹窗头部，正文不再重复
            title: clamped ? item.title : '',
            bodyHtml: sanitizeNewsHtml(item.contentHtml || item.contentText),
            itemId: item.id,
            showToggle: clamped && Boolean(item.contentMore),
            expanded: expandedIds.has(item.id),
            toggleClass: style.newsToggle,
          }),
        }}
      />
      {/* 展开补充正文：列表内点击展开后作为整块显示在正文下方，弹窗内默认展示（两者都不计入正文 3 行） */}
      {item.contentMore && (!clamped || expandedIds.has(item.id)) ? (
        <div className={style.newsMore}>{item.contentMore}</div>
      ) : null}
      {/* 经济数据指标行：国家 + 今值/预期/前值（国旗已移到正文标题左侧；空值展示 --，单位非空时拼在数值后） */}
      {calendar ? (
        <div className={style.newsCalendar}>
          {calendar.country ? <span className={style.newsCalendarCountry}>{calendar.country}</span> : null}
          <span>{`今值: ${formatCalendarValue(calendar.actual, calendar.unit)}`}</span>
          <span>{`预期: ${formatCalendarValue(calendar.forecast, calendar.unit)}`}</span>
          <span>{`前值: ${formatCalendarValue(calendar.previous, calendar.unit)}`}</span>
        </div>
      ) : null}
      {item.images && item.images.length > 0 ? (
        <div className={style.newsImages}>
          {item.images.map((src: string, index: number) => (
            <Image
              key={index}
              src={src}
              width={clamped ? 96 : 140}
              height={clamped ? 72 : 105}
              className={style.newsImg}
              // 自定义预览遮罩：只留小眼睛图标，去掉默认的「预览」文案
              preview={{ mask: <EyeOutlined style={{ fontSize: 20, color: '#fff' }} /> }}
            />
          ))}
        </div>
      ) : null}
      {/* 相关文章：固定在条目最下方，上游 item 带 article 时展示标题入口，蓝色链接样式，点击新标签页打开原文（stopPropagation 避免连带触发正文弹窗） */}
      {item.article ? (
        <div
          className={style.newsArticle}
          onClick={(e: React.MouseEvent): void => {
            e.stopPropagation()
            window.open(item.article ? item.article.uri : '', '_blank')
          }}
        >
          <FileTextOutlined />
          <span className={style.newsArticleLabel}>相关文章:</span>
          <span className={style.newsArticleTitle}>{item.article.title}</span>
        </div>
      ) : null}
      </div>
    </div>
    )
  }

  return (
    <div ref={topRef}>
      {/* 吸顶头：状态行（只看重要/刷新/日期）固定在滚动区上方，列表从它下方滚过而不带走这一行
          （本页滚动容器为 .ant-tabs-content-holder）；新快讯提示条挂在它的下沿但不占位 */}
      <div className={style.newsHeadSticky}>
        <div className={style.monitorInfo}>
          {/* 只看重要在前 + 手动刷新 + 当前日期（视口中部偏上条目所属日期），包成一个不换行、不收缩的整块；
              窄屏下长状态文案让位隐藏，保证这一行不折行且日期始终可见 */}
          <div className={style.newsFilter}>
            <Checkbox
              checked={importantOnly}
              onChange={(e) => onToggleImportant(e.target.checked)}
            >
              只看重要
            </Checkbox>
            {/* 列表已有数据时取锚点条目日期；首屏/骨架/空列表时直接跟页面时钟，跨零点不会停在旧日期 */}
            <span className={style.newsDateHeader}>
              {formatNewsDate(items.length > 0 ? headerDateMs : now)}
            </span>
            <RefreshButton onRefresh={onRefresh} />
          </div>
          <span className={style.newsStatusText}>{statusText}</span>
        </div>

        {/* 浮在吸顶头下沿的胶囊：不进入文档流，出现/消失都不会推下列表（屏效） */}
        {newCount > 0 && !atTop && (
          <div className={style.newNewsBar}>
            <Button size="small" type="primary" icon={<ArrowUpOutlined />} onClick={handleBackToNew}>
              {`${newCount} 条新快讯，点击回到顶部`}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <NewsSkeleton />
      ) : (
        <List
          className={style.newsList}
          dataSource={items}
          split={false}
          renderItem={(item: INewsItem) => (
            <List.Item key={item.id} className={style.newsItem} data-news-ts={item.displayTime}>
              {renderBody(item, true)}
            </List.Item>
          )}
        />
      )}

      {/* 底部状态：翻页加载 / 没有更多；哨兵始终挂载供观察 */}
      <div className={style.newsFooter}>
        {loadingMore ? <Skeleton active paragraph={{ rows: 1 }} title={false} /> : null}
        {!hasMore && !loading && items.length > 0 ? <span>没有更多了</span> : null}
      </div>
      <div ref={sentinelRef} className={style.newsSentinel} />

      {/* 点击快讯弹窗展示全部内容（标题上提到弹窗头部，下方依次是时间行 + 正文 + 补充正文 + 配图），不再跳转外链 */}
      <Modal
        open={active !== null}
        onCancel={closeDetail}
        footer={null}
        width={640}
        // 快讯原标题上提到弹窗头部；没有标题的条目回退成「快讯详情」（className 的用途见样式注释）
        className={style.newsModal}
        title={active?.title || '快讯详情'}
      >
        {active ? <div className={style.newsDetail}>{renderBody(active, false)}</div> : null}
      </Modal>
    </div>
  )
}

export { INewsBoardProps, NewsBoard }
