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
 * 条目布局：PC 与移动端统一走时间线（不再按断点分叉）：不给时间单独留一栏宽度，
 * 轴线画在卡片已有的左内边距里，时刻（只有 HH:mm）做正文上方一行小标签，内容区占满整宽；
 * PC 端靠 .pageHost 的 max-width 收窄阅读宽度并居中（限宽在页面根层，不在这个组件里）；
 * 样式见 .newsBody / .newsItem::before / .newsTimeCol；
 * 国旗 icon 行内拼在正文 HTML 前与标题同排；标题包成 .newsTitle span：宽屏用【】跟正文同行，
 * 窄屏去括号、加粗并靠 content 换行符独占一行（不改 block，避免切断与国旗同排的行内流）；
 * 「展开/收起」开关也拼在正文末尾，随文本流跟在正文最后一行之后（正文整段展示不做行数截断，
 * 所以不需要为避开裁切把开关脱流，见 .newsExcerpt / .newsToggle）。
 * 弹窗（快讯详情）不走这一套：标题放在弹窗头部（无标题时回退「快讯详情」），
 * 时间放在标题下方独立一行（带年/日期/星期），正文不再带【标题】前缀，也不渲染左侧时刻列；
 * 弹窗整体高度封顶（.newsModal：content 定高 flex + body 滚动），内容超长只滚 body，标题行不跟着滚走。
 */

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { List, Skeleton, Button, Image, Modal, Checkbox } from 'antd'
import { ArrowUpOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import { INewsCalendar, INewsItem } from '../types'
import { COLOR_UP } from '../constants'
import { formatNewsClock, formatNewsDate } from '../utils/format'
import { buildExcerptHtml, calendarKeyOf, formatCalendarValue, sanitizeNewsHtml } from '../utils/news'
import { RefreshButton } from './RefreshButton'
import { MonitorInfo } from './MonitorInfo'
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

/** 从给定节点向上找最近的可滚动祖先（真正的滚动容器，本页为 Container 的 .main） */
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

/**
 * 资讯看板本体
 * 用 memo 包住：外层页面壳的任何重渲染（时钟走字、弹窗开关）都不该让整个列表重排，
 * 自己只在 items 等入参真的变了才重算
 * 内部自有 state（滚动位置、展开、弹窗、日期锚点）不受影响，照旧由自身更新驱动重渲染
 */
const NewsBoard = memo(function NewsBoard({
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
  // 列表顶部锚点，点击「新快讯」/「回到顶部」时滚到这里
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
  // 点击正文后弹窗看详情的当前条目（正文本身不再截断，弹窗多给大图配图与标题下的时间行）
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

  /**
   * 切换「只看重要」后把滚动条直接归顶：
   * 筛选变化时 useNewsFeed 会清空列表并重拉第一页，若视口还停在旧列表的深层位置，
   * 新第一页渲染后会出现大幅跳动/错乱；这里立即归零，无论选中还是反选都从第一页顶部重新看起
   */
  const prevFilterRef = useRef<boolean>(importantOnly)
  useEffect(() => {
    if (prevFilterRef.current === importantOnly) {
      return
    }
    prevFilterRef.current = importantOnly
    const scroller: HTMLElement | null = findScroller(topRef.current)
    if (scroller) {
      scroller.scrollTop = 0
    } else {
      window.scrollTo(0, 0)
    }
    // 归顶后同步一次「在顶部」状态，让提示条/ackNew 逻辑跟着新位置走（不依赖 scroll 事件是否触发）
    setAtTop(true)
  }, [importantOnly])

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

  // 列表条目与弹窗共用的正文渲染（两者布局不同，由 inList 分支）：
  // 列表：时间线形态（时刻做正文上方一行小标签、轴线走卡片左内边距，不占内容宽度）；日期只在看板顶部状态行
  // 弹窗：不渲染时刻列，也不在正文里重复标题，改为弹窗头部显示标题 + 标题下方一行日期时刻
  // （经济数据指标行、展开补充、配图、相关文章始终跟正文同栏；重要/新标记已去掉）
  // inList=true：列表态，正文整段展示、点击弹窗看详情、鼠标手型；inList=false：弹窗内，不响应点击也不带展开开关
  const renderBody = (item: INewsItem, inList: boolean): JSX.Element => {
    // 条目带 calendar_key 且指标已拉到时渲染指标行；未拉到/失败则不展示（不占位）
    const calendar: INewsCalendar | undefined = calendarData[calendarKeyOf(item)]
    // 条目只留时刻：日期不在每条上重复，整列的日期语义由顶部状态行统一给出（跨零点的旧条目也一样，
    // 滚动到它们时状态行会换成对应日期），省屏效也让时间列宽度稳定
    const timeText: string = formatNewsClock(item.displayTime)
    return (
    <div className={style.newsBody}>
      {/* 时刻（只到分、数字等宽）：时间线形态下整宽占正文上方一行，轴线与节点由样式画在卡片左内边距里；
          score=2 重要快讯与正文同样标红，时间线节点跟着走 currentColor；
          弹窗内不渲染时刻列，换成标题下方的时间行 */}
      {inList ? (
        <div
          className={style.newsTimeCol}
          style={item.score === 2 ? { color: COLOR_UP } : undefined}
        >
          <div className={style.newsTimeClock}>{timeText}</div>
        </div>
      ) : null}
      <div className={style.newsMain}>
        {/* 弹窗：标题已提到弹窗头部，这里在标题下方补一行完整时间（年+日期+星期+时刻）；
            带上日期是因为弹窗已脱离看板顶部那条日期状态行，只剩时刻会看不出是哪一天 */}
        {inList ? null : (
          <div className={style.newsDetailTime}>{`${formatNewsDate(item.displayTime)} ${timeText}`}</div>
        )}
      {/* 正文：国旗、标题前缀、清洗后的正文 HTML、「展开」开关拼成单一行内流，一次 innerHTML 注入。
          必须同段注入：正文常以 <p> 等块级标签开头，已靠 sanitizeNewsHtml 拍平为纯行内流，
          拆开渲染时块级正文会切出独立行盒，把行外的国旗挤成独占一行（display: contents 包装在 Chromium 下同样不可靠）；
          开关用 data-toggle-id 标记，在 capture 阶段事件委托处理；正文内链接同阶段拦截开新页；点击正文弹窗看详情；score=2 标红；
          正文不做行数截断，开关就留在行内流里跟在正文末尾（见 .newsToggle） */}
      <div
        className={inList ? style.newsExcerpt : style.newsExcerptFull}
        style={item.score === 2 ? { color: COLOR_UP } : undefined}
        onClick={inList ? () => openDetail(item) : undefined}
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
            flagUri: calendar ? calendar.flagUri : '',
            flagClass: style.newsFlag,
            // 标题只在列表正文里给（弹窗内提到弹窗头部，正文不再重复）；【】括号与窄屏独占一行都由样式控制
            title: inList ? item.title : '',
            titleClass: style.newsTitle,
            bodyHtml: sanitizeNewsHtml(item.contentHtml || item.contentText),
            itemId: item.id,
            showToggle: inList && Boolean(item.contentMore),
            expanded: expandedIds.has(item.id),
            toggleClass: style.newsToggle,
          }),
        }}
      />
      {/* 展开补充正文：列表内点击「展开」后作为整块显示在正文下方，弹窗内默认展示 */}
      {item.contentMore && (!inList || expandedIds.has(item.id)) ? (
        <div className={style.newsMore}>{item.contentMore}</div>
      ) : null}
      {/* 经济数据指标行：国家 + 今值/预期/前值（国旗已移到正文标题左侧；空值展示 --，单位非空时拼在数值后） */}
      {calendar ? (
        <div className={style.newsCalendar}>
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
              width={inList ? 96 : 140}
              height={inList ? 72 : 105}
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
          （本页滚动容器为 Container 的 .main）；新快讯提示条挂在它的下沿但不占位 */}
      <div className={style.newsHeadSticky}>
        {/* 状态行与行情看板共用一套结构与样式（见 components/MonitorInfo）；
            只看重要 + 当前日期（视口中部偏上条目所属日期）+ 手动刷新包成不换行、不收缩的整块，
            窄屏下长状态文案让位隐藏，保证这一行不折行且日期始终可见 */}
        <MonitorInfo
          leading={
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
          }
          text={statusText}
          textClassName={style.newsStatusText}
        />

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

      {/* 点击快讯弹窗展示全部内容（标题上提到弹窗头部，下方依次是时间行 + 正文 + 补充正文 + 配图），不再跳转外链；
          弹窗高度封顶在视口内，超出部分只滚 body（样式见 .newsModal 注释） */}
      <Modal
        open={active !== null}
        onCancel={closeDetail}
        footer={null}
        width={640}
        // 快讯原标题上提到弹窗头部；没有标题的条目回退成「快讯详情」（className 的用途见样式注释）；
        // score=2 重要快讯的标题与正文内容区同样标红（见 renderBody 正文的着色逻辑）
        className={style.newsModal}
        title={
          <span style={active && active.score === 2 ? { color: COLOR_UP } : undefined}>
            {active?.title || '快讯'}
          </span>
        }
      >
        {active ? <div className={style.newsDetail}>{renderBody(active, false)}</div> : null}
      </Modal>
    </div>
  )
})

export { INewsBoardProps, NewsBoard }
