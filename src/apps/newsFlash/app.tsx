/**
 * NewsFlashPage - 财经快讯看板（独立页面，原先是监控页里的「资讯」Tab）
 *
 * 功能说明：
 * 1. 华尔街见闻全球频道快讯：进页拉第一页 + 下滑游标翻页；服务端常驻长连接通过 SSE 实时推送新快讯
 * 2. 条目带 calendar_key（经济数据快讯）时另拉 /news/calendar，在正文下方展示今值/预期/前值（国旗排在标题左侧）
 * 3. 「只看重要」勾选后向 lives 传 score=2，并对 SSE 推送按分值过滤
 * 4. 资讯不轮询：进页拉第一页后经 SSE 长连接实时接收新快讯，刷新按钮手动重取第一页（30 秒倒计时防穿透）
 * 5. 登录态：进页先由服务端确认（token 过期也算未登录），未登录跳登录页，登录后通过 from 参数跳回本页；
 *    快讯与 SSE 推送均需登录，分享链接（handleType=share）不再免登放行，未登录一律跳登录页（见 hooks/useLoginGuard）
 *
 * 文件结构（本目录，与 timeSeriesMetrics 完全独立、互不引用）：
 * - main.tsx        webpack 入口，挂载 React 根节点
 * - app.tsx         页面编排：装配外壳、登录与时钟，把数据源接到资讯看板
 * - types/          快讯与财经日历的展示结构、上游返回结构
 * - constants/      标红配色、占位符、时钟步长、接口地址与频道参数
 * - utils/          news 上游解析与正文清洗、format 时间与数值格式化
 * - hooks/          useNewsFeed（列表 + 游标翻页 + SSE 推送 + 日历指标按需拉取）、useClock、useLoginGuard
 * - components/     NewsBoard（无限滚动 + 详情弹窗）、NewsSkeleton（首屏骨架）、MonitorInfo（状态行）、RefreshButton
 * - styles/         index.module.less 页面外壳与快讯样式
 *
 * 依赖：React, Ant Design
 */
import React, { useCallback, useEffect, useState } from 'react'
import Header from '@components/Header'
import Container from '@components/Container'
import Fixed from '@components/Fixed'
import { CLOCK_TICK_MS } from './constants'
import { useClock } from './hooks/useClock'
import { useLoginGuard } from './hooks/useLoginGuard'
import { useNewsFeed } from './hooks/useNewsFeed'
import { NewsBoard } from './components/NewsBoard'
import style from './styles/index.module.less'
import '@assets/css/index.global.less'

/**
 * 页面外壳尺寸：透传给 Container 的 .main 与 Header（只覆盖本页，不动共享组件样式，其他页面不受影响）
 * 1）.main 顶部留白 20px 去零（本页是铺满高度的内部滚动布局），左右 15px 收窄到 8px 省屏效；
 *    Header 同步收到 8px，让返回按钮与下方内容左缘对齐
 * 2）必须显式声明 boxSizing + width：两种构建入口的 CSS 重置不一样（浏览器构建走 src/index.ejs，
 *    无全局重置，div 默认 content-box；App 构建走 src/index-app.html，有 * { box-sizing: border-box }）。
 *    content-box 下共享样式的 width: calc(100% - 30px) 算的是内容宽，内边距一缩盒子就等量变窄，
 *    右侧会凭空多出一条缺口；钉成 border-box + 100% 后两侧留白恒定对称
 */
const SHELL_STYLE: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  padding: '0 8px',
}

/**
 * NewsFlash 组件
 * 单页只装资讯看板：.main 自身就是滚动容器（吸顶头与触底哨兵都相对它工作），不再套一层滚动盒
 */
function NewsFlash(): JSX.Element {
  // 登录态：未登录时跳转登录页，校验中不渲染内容也不发请求；分享链接（?handleType=share）下直接为 true
  const authed: boolean = useLoginGuard()
  // 时钟快照：列表还没数据时（首屏/骨架/空列表），顶部状态行的日期靠它跨零点自动换新
  const clock: number = useClock(CLOCK_TICK_MS)
  // 资讯「只看重要」筛选：勾选后向 lives 传 score=2，并对 SSE 推送按分值过滤
  const [importantOnly, setImportantOnly] = useState<boolean>(false)

  const newsFeed = useNewsFeed({
    enabled: authed,
    importantOnly,
  })

  /** 切换「只看重要」：无论选中还是反选，都清空列表回到第一页，并把滚动条直接归顶（见 useNewsFeed / NewsBoard） */
  const handleToggleImportant = useCallback((checked: boolean): void => {
    setImportantOnly(checked)
  }, [])

  /** 点击本地通知：接管 app-pages.js 广播的 onNotifyClick，用 openPage 拉起本页（已在页内则复用 webview） */
  useEffect(() => {
    ;(window as unknown as {
      onNotifyClick?: (payload: { page?: string } | null) => void
    }).onNotifyClick = (payload): void => {
      const page: string = (payload && payload.page) || 'newsFlash'
      const open = (window as unknown as { openPage?: (p: string, params?: object) => void }).openPage
      if (typeof open === 'function') open(page, undefined)
    }
    return (): void => {
      ;(window as unknown as { onNotifyClick?: unknown }).onNotifyClick = undefined
    }
  }, [])

  // 校验中或未登录时不渲染页面内容：也就不会在失效会话下先把资讯请求发出去
  if (!authed) {
    return <></>
  }

  // Container 的 style 透传给 .main，具体取值与设计取舍见 SHELL_STYLE 定义处
  return (
    <>
      <Container
        main={
          <div className={style.pageHost}>
            <NewsBoard
              items={newsFeed.items}
              loading={newsFeed.loading}
              loadingMore={newsFeed.loadingMore}
              hasMore={newsFeed.hasMore}
              error={newsFeed.error}
              newCount={newsFeed.newCount}
              calendarData={newsFeed.calendarData}
              importantOnly={importantOnly}
              now={clock}
              onToggleImportant={handleToggleImportant}
              onLoadMore={newsFeed.loadMore}
              onRefresh={newsFeed.refresh}
              onAckNew={newsFeed.ackNew}
            />
          </div>
        }
        style={SHELL_STYLE}
        // 本页关掉动画底图，改用静态渐变（Container 默认是动画 webp）：
        // 卡片/吸顶头都带 backdrop-filter，模糊要对背后内容实时重算；
        // 底图每一帧都在变 = 每个模糊层每帧重算一次，长列表滚动时直接掉帧。
        // 静态渐变下模糊结果可被缓存，合成成本基本归零，视觉上只是失去背景动效
        isAnimationBackground={false}
        header={<Header name="财经快讯" leftPath="/tool" headerStyle={SHELL_STYLE} />}
      />
      {/* backTop：常驻「回到顶部」（由 Fixed 统一承载，基于 antd FloatButton.BackTop），
          与工具列上下错开不遮挡，且 Fixed 收起时仍可见；滚动目标为 Container 的 .main（data-scroll-container） */}
      <Fixed backTop />
    </>
  )
}

export default NewsFlash
