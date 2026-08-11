/**
 * StockDashboard - 股票行情监控面板
 *
 * 功能说明：
 * 1. 支持输入多个股票代码（逗号分隔），批量查询实时行情
 * 2. 展示每只股票的最新价、涨跌幅、五档盘口等核心数据
 * 3. 数据来源：腾讯财经行情接口（qt.gtimg.cn）
 *
 * 依赖：React, Ant Design
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Tag,
  Statistic,
  Modal,
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { getSearchParams, IsPC } from 'methods-r'
import { isAfterClose } from './utils';
import Header from '@components/Header'
import Container from '@components/Container'
import Fixed from '@components/Fixed'
import '@assets/css/index.global.less'
import orderbook from './orderbook.svg';
import tonghuashun from './tonghuashun.svg';

import style from './index.module.less'

const { Title, Text } = Typography

// ===================== 常量定义 =====================

/** A股红涨绿跌配色 */
const COLOR_UP = '#cf1322'
const COLOR_DOWN = '#3f8600'

/** 五档盘口档位数 */
const ORDER_BOOK_LEVELS = 5

/** 默认监控股票代码 */
const DEFAULT_STOCK_CODES = getSearchParams('codes')

/** 腾讯行情接口地址 */
const QUOTE_API_URL = 'https://qt.gtimg.cn/q='

// ===================== 类型定义 =====================

/** 单档盘口数据 */
interface IOrderBookRow {
  key: number
  buyPrice: string
  buyVol: string
  sellPrice: string
  sellVol: string
}

/** 股票统计数据 */
interface IStockStats {
  open: number
  high: number
  low: number
  preClose: number
  volume: string
  turnover: string
  pe: string
  totalMarketCap: string
  turnoverPct: number
  lb: number
  amplitude?: number
}

/** 解析后的单只股票数据 */
interface IStockData {
  id: string
  name: string
  code: string
  price: number
  changePct: number
  changeAmt: number
  color: string
  isUp: boolean
  stats: IStockStats
  orderBook: IOrderBookRow[]
  updateTime: string
}

// ===================== 工具函数 =====================

/**
 * 格式化时间字符串
 * 将 "20260810143025" 格式转换为 "2026-08-10 14:30:25"
 * @param t - 原始时间字符串（14位数字）
 * @returns 格式化后的时间字符串，若长度不足则原样返回
 */
function formatTime(t: string): string {
  if (!t || t.length < 14) {
    return t
  }

  return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)} ${t.slice(
    8,
    10
  )}:${t.slice(10, 12)}:${t.slice(12, 14)}`
}

/**
 * 解析单行股票行情数据
 *
 * 腾讯接口返回格式示例：
 *   v_sz002335="51~天山股份~002335~12.50~12.30~..."
 *
 * 字段以 ~ 分隔，各字段含义参见腾讯行情接口文档
 *
 * @param line - 单行原始行情字符串
 * @returns 解析后的股票数据对象，解析失败返回 null
 */
const parseOneStock = (line: string): IStockData | null => {
  // 正则匹配股票代码和行情数据部分
  const metaMatch = line.match(/v_(s[hz]\d+)="([^"]+)"/)
  if (!metaMatch) {
    return null
  }

  const stockCode: string = metaMatch[1] // 如 "sz002335"
  const fields: string[] = metaMatch[2].split('~')

  // 基础行情数据提取
  const name: string = fields[1]
  const code: string = fields[2]
  const price: number = parseFloat(fields[3])
  const open: number = parseFloat(fields[5])
  const high: number = parseFloat(fields[33])
  const low: number = parseFloat(fields[34])
  const preClose: number = parseFloat(fields[4])
  const changeAmt: number = parseFloat(fields[31])
  const changePct: number = parseFloat(fields[32])
  const volume: string = fields[6] // 成交量（手）
  const turnover: string = fields[37] // 成交额（元）
  const turnoverPct: number = parseFloat(fields[38]) // 换手率（%）
  const pe: string = fields[39] // 市盈率
  const totalMarketCap: string = fields[45] // 总市值
  const lb: number = parseFloat(fields[49]) // 量比
  const amplitude = parseFloat(fields[43]) // 振幅

  // 涨跌颜色逻辑（A股：红涨绿跌）
  const isUp: boolean = changePct > 0
  const color: string = isUp ? COLOR_UP : COLOR_DOWN

  // 构建五档盘口数据（买1~买5，卖1~卖5）
  const orderBookData: IOrderBookRow[] = []
  for (let i = 0; i < ORDER_BOOK_LEVELS; i++) {
    orderBookData.push({
      key: i,
      buyPrice: fields[9 + i * 2], // 买价
      buyVol: fields[10 + i * 2], // 买量
      sellPrice: fields[19 + i * 2], // 卖价
      sellVol: fields[20 + i * 2], // 卖量
    })
  }

  return {
    id: stockCode,
    name,
    code,
    price,
    changePct,
    changeAmt,
    color,
    isUp,
    stats: {
      open,
      high,
      low,
      preClose,
      volume,
      turnover,
      pe,
      totalMarketCap,
      turnoverPct,
      lb,
      amplitude,
    },
    orderBook: orderBookData,
    updateTime: formatTime(fields[30]),
  }
}

// ===================== 组件部分 =====================

/**
 * StockDashboard 组件
 * 股票行情监控面板，支持多股票批量查询与实时展示
 */
function StockDashboard(): JSX.Element {
  const isClose = isAfterClose(new Date())
  // 输入框中的股票代码字符串
  const [inputValue, setInputValue] = useState<string>(DEFAULT_STOCK_CODES)
  // 解析后的股票数据列表
  const [stockList, setStockList] = useState<IStockData[]>([])
  // 数据加载状态
  const [loading, setLoading] = useState<boolean>(false)
  // 弹窗中展示的股票盘口数据
  const [detailStock, setDetailStock] = useState<IStockData | null>(null)

  /**
   * 从腾讯行情接口获取股票数据
   * @param codes - 逗号分隔的股票代码字符串，如 "sz002335,sh600519"
   */
  const fetchData = useCallback(async (codes: string): Promise<void> => {
    if (!codes) {
      return
    }

    setLoading(true)
    try {
      const response: Response = await fetch(`${QUOTE_API_URL}${codes}`)
      // 接口返回 GBK 编码，需要用 TextDecoder 解码
      const arrayBuffer: ArrayBuffer = await response.arrayBuffer()
      const decoder = new TextDecoder('gbk')
      const rawText: string = decoder.decode(arrayBuffer)

      // 按分号分割多只股票数据，过滤空行
      const lines: string[] = rawText
        .split(';')
        .filter((line: string) => line.trim().length > 0)

      // 逐行解析并过滤无效数据
      const parsedData: IStockData[] = lines
        .map(parseOneStock)
        .filter((item: IStockData | null): item is IStockData => item !== null)
      setStockList(parsedData)
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 组件挂载时执行一次初始化查询
  useEffect(() => {
    let timer = null
    fetchData(inputValue)

    if (isClose) {
      timer && clearInterval(timer)
      timer = null
      return
    }
    // 如需自动刷新，可取消下方注释：
    timer = setInterval(() => fetchData(inputValue), 10 * 1000)
    return () => clearInterval(timer)
  }, [fetchData, inputValue])

  /** 点击查询按钮或按回车时触发搜索 */
  const handleSearch = useCallback((): void => {
    fetchData(inputValue)
  }, [fetchData, inputValue])

  /** 输入框值变更回调 */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setInputValue(e.target.value)
    },
    []
  )

  // 盘口表格列定义
  const orderColumns = [
    {
      title: '买',
      dataIndex: 'buyPrice',
      key: 'buyPrice',
      render: (text: string): JSX.Element => (
        <span style={{ color: COLOR_UP }}>{text}</span>
      ),
    },
    { title: '量', dataIndex: 'buyVol', key: 'buyVol' },
    {
      title: '卖',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (text: string): JSX.Element => (
        <span style={{ color: COLOR_DOWN }}>{text}</span>
      ),
    },
    { title: '量', dataIndex: 'sellVol', key: 'sellVol' },
  ]

  // 计算当前监控的股票数量
  const stockCount: number = inputValue?.split(',').length

  return (
    <>
      <Container
        main={
          <div>
            {/* 顶部搜索栏 */}
            <Card className={style.searchCard}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Input
                    placeholder="输入代码，逗号分隔 (如: sz002335)"
                    value={inputValue}
                    onChange={handleInputChange}
                    onPressEnter={handleSearch}
                  />
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    loading={loading}
                  >
                  </Button>
                </Col>
              </Row>
              {!!stockCount && (
                <div className={style.monitorInfo}>
                  当前监控: {stockCount} 只股票 |{' '}
                  {isClose ? '已收盘' : '自动刷新中...'}
                </div>
              )}
            </Card>

            {/* 股票列表网格 */}
            <Row gutter={[8, 8]}>
              {stockList.map((stock: IStockData) => (
                <Col xs={24} lg={12} xl={8} key={stock.id}>
                  <Card
                    size="small"
                    className={style.card}
                    title={
                      <div
                        className={style.cardTitle}
                      >
                        <span>
                          <Tag color="blue">
                            {stock.code.replace(/^(s[hz])/, '')}
                          </Tag>
                          <span className={style.stockName}>
                            {stock.name}
                          </span>
                        </span>
                      </div>
                    }
                    extra={<>
                      <div className={style.detailBtn} onClick={() => setDetailStock(stock)}>
                        <img src={orderbook} title="盘口" />
                      </div>
                      <div className={style.detailBtn} style={{ marginLeft: 12 }} onClick={(e) => {
                        e.stopPropagation()
                        const code = stock.code.replace(/^(s[hz])/, '')
                        // 先尝试打开同花顺 App，失败则降级到网页版
                        // try {
                        //   window.location.href = `hexin://stock?code=${code}`
                        // } catch (err) {
                        //   // scheme 未注册时静默忽略
                        // }
                        window.open(`https://stockpage.10jqka.com.cn/${code}/`, '_blank')
                      }}>
                        <img src={tonghuashun} title="同花顺 App" />
                      </div>
                    </>}
                  >
                    {/* 更新时间 */}
                    <Text type="secondary" className={style.updateTime} style={{ display: 'block', marginBottom: 8 }}>
                      {stock.updateTime}
                    </Text>
                    {/* 中部详细数据 & 盘口 */}
                    <Row gutter={16}>
                      {/* 左侧：关键指标 */}
                      <Col span={IsPC() ? 24 : 24}>
                        <div
                          className={style.gridContainer}
                        >
                          {/* 最新价 & 涨跌幅 */}
                          <div
                            className={style.priceRow}
                          >
                            <Title
                              level={2}
                              className={style.priceTitle}
                              style={{ color: stock.color }}
                            >
                              {stock.price.toFixed(2)}
                            </Title>
                            <Statistic
                              value={stock.changePct}
                              precision={2}
                              suffix="%"
                              valueStyle={{
                                color: stock.color,
                                fontSize: 18,
                                marginLeft: 12,
                              }}
                              prefix={
                                stock.isUp ? (
                                  <ArrowUpOutlined />
                                ) : (
                                  <ArrowDownOutlined />
                                )
                              }
                            />
                            <Text className={style.changeAmt} style={{ color: stock.color }}>
                              {stock.changeAmt > 0 ? '+' : ''}
                              {stock.changeAmt}
                            </Text>
                          </div>
                          {/* 今开价 */}
                          <div>
                            <Text type="secondary">今开</Text>
                            <br />
                            {stock.stats.open}
                          </div>
                          {/* 最高价 */}
                          <div>
                            <Text type="secondary">最低/最高</Text>
                            <br />
                            {stock.stats.low} - {stock.stats.high}
                          </div>
                          {/* 昨收价 */}
                          <div>
                            <Text type="secondary">昨收</Text>
                            <br />
                            {stock.stats.preClose}
                          </div>
                          {/* 成交额 */}
                          <div>
                            <Text type="secondary">成交额</Text>
                            <br />
                            {(parseFloat(stock.stats.turnover) / 10000).toFixed(2)}亿
                          </div>
                          <div>
                            <Text type="secondary">换手率</Text>
                            <br />
                            {stock.stats.turnoverPct?.toFixed(2)}%
                          </div>
                          <div>
                            <Text type="secondary">量比</Text>
                            <br />
                            {stock.stats.lb?.toFixed(2)}%
                          </div>
                          <div>
                            <Text type="secondary">振幅</Text>
                            <br />
                            {stock.stats.amplitude?.toFixed(2)}%
                          </div>
                          {/* 总市值 */}
                          <div>
                            <Text type="secondary">市值</Text>
                            <br />
                            {parseFloat(stock.stats.totalMarketCap).toFixed(2)}亿
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 五档盘口详情弹窗 */}
            <Modal
              title={
                detailStock
                  ? `${detailStock.name} (${detailStock.code.replace(/^(s[hz])/, '')}) - 五档盘口`
                  : '五档盘口'
              }
              open={!!detailStock}
              onCancel={() => setDetailStock(null)}
              footer={null}
              width={400}
            >
              {detailStock && (
                <Table
                  dataSource={detailStock.orderBook}
                  columns={orderColumns}
                  pagination={false}
                  size="small"
                  bordered
                  rowClassName={(
                    _record: IOrderBookRow,
                    index: number
                  ): string =>
                    index % 2 === 0 ? '' : 'table-row-light-gray'
                  }
                />
              )}
            </Modal>
          </div>
        }
        header={<Header name="股票行情监控" leftPath={`/${APP_NAME}/tool`} />}
      />
      <Fixed />
    </>
  )
}

export default StockDashboard
