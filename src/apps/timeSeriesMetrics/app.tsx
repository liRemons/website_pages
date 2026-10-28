/**
 * IndexDashboard - 多市场指数行情看板
 *
 * 功能说明：
 * 1. 「个股行情」：输入股票代码（逗号分隔）批量查询实时行情，含五档盘口弹窗与同花顺跳转
 * 2. 「沪深港行情」：国内主要指数（含北证50）+ 港股主要指数
 * 3. 「其他市场行情（含台湾）」：美/英/德/法/日/韩/台/新/澳/印/俄等主要指数
 * 4. 「大宗商品」：贵金属、能源、美元指数与主要货币对（全天滚动品种）
 * 5. 「资讯」：华尔街见闻全球频道快讯，进页拉第一页 + 下滑游标翻页；服务端常驻长连接通过 SSE 实时推送新快讯；
 *    条目带 calendar_key（经济数据快讯）时另拉 /news/calendar，在正文下方展示国旗与今值/预期/前值
 * 6. 数据来源（服务端 /quote/global 内部为双通道）：
 *    - 个股与沪深港：服务端 /quote/query（转发腾讯财经行情接口 qt.gtimg.cn）
 *    - 美股三大指数：腾讯通道（实测覆盖 usDJI/usINX/usIXIC），东财按 IP 封禁时仍可用
 *    - 其余市场：东方财富 push2 接口（腾讯不覆盖日经、德法指数、韩国综合、台湾加权等）
 *    - 大宗商品与外汇：服务端 /quote/commodity（转发华尔街见闻行情数据中心）
 *    - 服务端会把两个通道的结果整成同一结构，并用 src 标出每条数据的来源
 * 7. 指数与品种为固定清单，行情字段缺失时以占位符展示
 * 8. 沪深港与个股跟随交易阶段（盘前/集合竞价/盘中/午间休市/盘后/休市）调节轮询频率
 * 9. 每张卡片有两个独立标识：
 *    - 时段标识（盘前/盘中/午休/盘后/休市）：市场 IANA 时区 + 交易所当地时段表，夏令时自动跟随
 *    - 数据标识（更新中/已停更）：看行情时间新不新，不依赖时段表；
 *      港股源行情时间固定滞后约 15 分钟，改用本轮响应到达时间判定，悬停说明里带出滞后事由
 * 10. 轮询节奏：沪深港与个股自动轮询（交易阶段/固定频率 + 数据标识纠偏）；
 *    其他市场与大宗商品不轮询，进页只拉一次，由卡片上方的刷新按钮手动取数（30 秒禁用倒计时防高频穿透）；
 *    资讯不轮询，进页拉第一页后经 SSE 长连接实时接收新快讯
 *
 * 文件结构（本目录）：
 * - main.tsx        webpack 入口，挂载 React 根节点
 * - app.tsx         页面编排：装配五个数据源、生成状态文案、拼 Tab（取数与轮询都在 hooks 里）
 * - types/          共享类型：IQuote 与三个上游各自的返回结构
 * - constants/      配色字号、Tab 与存储键、刷新间隔、接口地址、港股源时间滞后说明、各市场时段表、三份指数品种清单
 * - utils/          方法：format 展示格式化、parse 上游解析、prefs 偏好读写、schedule 轮询间隔、
 *                   market 时段判定与数据标识/板块活跃度引擎
 * - hooks/          数据源：useQuoteFeed（行情通用轮询引擎）、useIndexFeeds（三个指数 Tab 适配）、
 *                   useStockFeed（个股查询）、useNewsFeed（资讯列表 + 游标翻页 + SSE 实时推送 + 日历指标按需拉取）、useClock、useLoginGuard
 * - components/     IndexCard（双标识卡片）、IndexBoard（分组看板）、StockBoard（个股看板）、NewsBoard（资讯看板，无限滚动）、RefreshButton（手动刷新按钮）、CardSkeletonGrid（无数据时骨架屏）
 * - styles/         index.module.less 页面与卡片样式
 * - assets/svg/     盘口与同花顺图标
 *
 * 依赖：React, Ant Design
 */
import React, { useCallback, useMemo, useState } from 'react'
import { Tabs } from 'antd'
import Header from '@components/Header'
import Container from '@components/Container'
import Fixed from '@components/Fixed'
import { IStockData } from './types'
import {
  ACTIVE_TAB_STORAGE_KEY,
  CLOCK_TICK_MS,
  COMMODITY_REFRESH_MS,
  GLOBAL_REFRESH_MS,
  QUOTE_IDLE_POLL_MS,
  TAB_CN_HK,
  TAB_COMMODITY,
  TAB_GLOBAL,
  TAB_STOCK,
  TAB_NEWS,
} from './constants'
import { getInitialTab } from './utils/prefs'
import { formatClock } from './utils/format'
import { getTradingIntervalMs } from './utils/schedule'
import { IBoardPhase, getBoardPhase } from './utils/market'
import { useClock } from './hooks/useClock'
import { useLoginGuard } from './hooks/useLoginGuard'
import {
  useCnHkFeed,
  useCommodityFeed,
  useGlobalFeed,
} from './hooks/useIndexFeeds'
import { useStockFeed } from './hooks/useStockFeed'
import { useNewsFeed } from './hooks/useNewsFeed'
import { IndexBoard } from './components/IndexBoard'
import { StockBoard } from './components/StockBoard'
import { NewsBoard } from './components/NewsBoard'
import { RefreshButton } from './components/RefreshButton'
import style from './styles/index.module.less'
import '@assets/css/index.global.less'

/**
 * 页面外壳尺寸：透传给 Container 的 .main 与 Header（只覆盖本页，不动共享组件样式，其他页面不受影响）
 * 1）.main 顶部留白 20px 去零（本页是铺满高度的内部滚动布局），左右 15px 收窄到 8px 省屏效；
 *    Header 同步收到 8px，让返回按钮与下方 Tab 标签左缘对齐
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
 * IndexDashboard 组件
 * 多市场行情看板，按 Tab 切换个股查询、沪深港指数、国际指数与大宗商品
 */
function IndexDashboard(): JSX.Element {
  // 登录态校验：未登录时重定向到登录页，登录后通过 from 参数跳回本页
  const authed: boolean = useLoginGuard()
  // 时钟快照，页面长时间打开时仍能感知时段切换
  const clock: number = useClock(CLOCK_TICK_MS)
  // 沪深港当前所处的交易阶段（盘前/集合竞价/盘中/午间休市/盘后/休市）
  const boardPhase = useMemo<IBoardPhase>(
    () => getBoardPhase(new Date(clock)),
    [clock]
  )
  // 个股与沪深港共用的轮询间隔，0 表示当前阶段不轮询
  const tradingIntervalMs: number = getTradingIntervalMs(boardPhase)
  // 当前激活的 Tab
  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab())
  // 资讯「只看重要」筛选：勾选后向 lives 传 score=2，并对 SSE 推送按分值过滤
  const [newsImportantOnly, setNewsImportantOnly] = useState<boolean>(false)
  // 弹窗中展示的股票盘口数据
  const [detailStock, setDetailStock] = useState<IStockData | null>(null)

  // 四路数据源只有当前激活的那一路发请求与轮询，切走即清理定时器
  const stockFeed = useStockFeed({
    enabled: authed && activeTab === TAB_STOCK,
    intervalMs: tradingIntervalMs,
  })
  const cnhkFeed = useCnHkFeed({
    enabled: authed && activeTab === TAB_CN_HK,
    baseIntervalMs: tradingIntervalMs,
    now: clock,
  })
  const globalFeed = useGlobalFeed({
    enabled: authed && activeTab === TAB_GLOBAL,
    baseIntervalMs: GLOBAL_REFRESH_MS,
    now: clock,
  })
  const commodityFeed = useCommodityFeed({
    enabled: authed && activeTab === TAB_COMMODITY,
    baseIntervalMs: COMMODITY_REFRESH_MS,
    now: clock,
  })
  // 资讯快讯：进页拉第一页 + 滑到底翻页，服务端长连接推送的新快讯由 hook 定时轮询增量追到顶部
  const newsFeed = useNewsFeed({
    enabled: authed && activeTab === TAB_NEWS,
    importantOnly: newsImportantOnly,
  })

  /** 切换「只看重要」：变更会触发资讯 hook 重新拉第一页 */
  const handleToggleImportant = useCallback((checked: boolean): void => {
    setNewsImportantOnly(checked)
  }, [])

  /** 打开指定股票的盘口弹窗 */
  const handleDetail = useCallback((stock: IStockData): void => {
    setDetailStock(stock)
  }, [])

  /** 关闭盘口弹窗 */
  const handleCloseDetail = useCallback((): void => {
    setDetailStock(null)
  }, [])

  /** Tab 切换时记忆选择，便于下次进入回到同一市场 */
  const handleTabChange = useCallback((key: string): void => {
    setActiveTab(key)
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, key)
  }, [])

  // 未登录时不渲染页面内容，等待跳转登录页
  if (!authed) {
    return <></>
  }

  // 市场阶段提示文案（个股与沪深港公用）：休市阶段仅说明状态，不展示刷新频率
  const phaseText: string = tradingIntervalMs
    ? `${boardPhase.label} · ${Math.round(tradingIntervalMs / 1000)} 秒自动刷新`
    : `${boardPhase.label} · 已暂停刷新`
  // 沪深港状态文案：间隔被行情活跃度纠偏时要说明原因，避免文案与实际刷新节奏不一致
  const cnhkIdleMinutes: number = Math.round(QUOTE_IDLE_POLL_MS / 60000)
  const cnhkCadenceText: string = !cnhkFeed.intervalMs
    ? '已暂停刷新'
    : cnhkFeed.activity === 'idle'
    ? `行情已停更，可能为节假日或临时休市 · ${cnhkIdleMinutes} 分钟低频刷新`
    : cnhkFeed.activity === 'active' && !tradingIntervalMs
    ? `阶段判断为休市但行情仍在更新 · ${cnhkIdleMinutes} 分钟低频刷新`
    : `${Math.round(cnhkFeed.intervalMs / 1000)} 秒自动刷新`
  const cnhkStatusText: string = `${boardPhase.label} · ${cnhkCadenceText}`
  // 已提交查询的股票数量（空代码不计）
  const stockCount: number = stockFeed.activeCodes
    ? stockFeed.activeCodes
        .split(',')
        .filter((code: string) => code.trim().length > 0).length
    : 0
  const stockStatusText: string = stockCount
    ? `当前监控: ${stockCount} 只股票 | ${phaseText}`
    : '输入股票代码后点击查询'
  /**
   * 国际行情状态文案（已改为手动刷新，不再自动轮询）
   * 服务端因上游限流回退缓存时，明说当前展示的是何时取回的数据
   */
  const globalStatusText: string = globalFeed.stale
    ? globalFeed.cachedAt
      ? `行情源限流保护中，当前为 ${formatClock(globalFeed.cachedAt)} 的数据，可手动重试`
      // 东财整块不可用但腾讯美股通道可用时，服务端回的是部分数据，没有可回的旧数据时间
      : '部分行情源不可用，暂时只展示可用通道的指数'
    : globalFeed.activity === 'idle'
    ? '全球主要指数均处于收盘时段'
    : '已停止自动刷新，点击左侧「刷新」获取最新'
  /**
   * 大宗商品状态文案（已改为手动刷新，不再自动轮询）
   * 上游异常时服务端会回退到最近一次成功的品种数据，同样明说取回时间
   */
  const commodityStatusText: string = commodityFeed.stale
    ? commodityFeed.cachedAt
      ? `行情源异常，当前为 ${formatClock(commodityFeed.cachedAt)} 的数据，可手动重试`
      : '行情源异常且无可用历史数据'
    : commodityFeed.activity === 'idle'
    ? '电子盘休市'
    : '已停止自动刷新，点击左侧「刷新」获取最新'

  // Container 的 style 透传给 .main，具体取值与设计取舍见 SHELL_STYLE 定义处
  return (
    <>
      <Container
        main={
          <div className={style.tabsHost}>
            <Tabs
              className={style.tabsWrap}
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                {
                  key: TAB_STOCK,
                  label: '个股行情',
                  children: (
                    <StockBoard
                      list={stockFeed.list}
                      loading={stockFeed.loading}
                      inputValue={stockFeed.inputValue}
                      statusText={stockStatusText}
                      detailStock={detailStock}
                      onInputChange={stockFeed.changeInput}
                      onSearch={stockFeed.search}
                      onDetail={handleDetail}
                      onCloseDetail={handleCloseDetail}
                    />
                  ),
                },
                {
                  key: TAB_CN_HK,
                  label: '沪深港行情',
                  children: (
                    <IndexBoard
                      list={cnhkFeed.list}
                      loading={cnhkFeed.loading}
                      refreshLabel={cnhkStatusText}
                      errorText={cnhkFeed.error}
                      now={clock}
                      activity={cnhkFeed.activity}
                    />
                  ),
                },
                {
                  key: TAB_GLOBAL,
                  label: '其他市场行情（含台湾）',
                  children: (
                    <IndexBoard
                      list={globalFeed.list}
                      loading={globalFeed.loading}
                      refreshLabel={globalStatusText}
                      errorText={globalFeed.error}
                      groupedByMarket
                      now={clock}
                      activity={globalFeed.activity}
                      refreshAction={<RefreshButton onRefresh={globalFeed.refresh} />}
                    />
                  ),
                },
                {
                  key: TAB_COMMODITY,
                  label: '大宗商品',
                  children: (
                    <IndexBoard
                      list={commodityFeed.list}
                      loading={commodityFeed.loading}
                      refreshLabel={commodityStatusText}
                      errorText={commodityFeed.error}
                      groupedByMarket
                      now={clock}
                      activity={commodityFeed.activity}
                      refreshAction={<RefreshButton onRefresh={commodityFeed.refresh} />}
                    />
                  ),
                },
                {
                  key: TAB_NEWS,
                  label: '资讯',
                  children: (
                    <NewsBoard
                      items={newsFeed.items}
                      loading={newsFeed.loading}
                      loadingMore={newsFeed.loadingMore}
                      hasMore={newsFeed.hasMore}
                      error={newsFeed.error}
                      newCount={newsFeed.newCount}
                      calendarData={newsFeed.calendarData}
                      importantOnly={newsImportantOnly}
                      now={clock}
                      onToggleImportant={handleToggleImportant}
                      onLoadMore={newsFeed.loadMore}
                      onRefresh={newsFeed.refresh}
                      onAckNew={newsFeed.ackNew}
                    />
                  ),
                },
              ]}
            />
          </div>
        }
        style={SHELL_STYLE}
        header={<Header name="监控" leftPath='/tool' headerStyle={SHELL_STYLE} />}
      />
      <Fixed />
    </>
  )
}

export default IndexDashboard
