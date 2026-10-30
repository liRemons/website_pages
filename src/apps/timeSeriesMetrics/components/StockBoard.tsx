/**
 * 个股看板
 * 代码输入与查询、个股卡片列表、五档盘口弹窗，以及跳转同花顺行情页
 */

import React, { memo } from 'react'
import { Button, Card, Col, Input, Modal, Row, Statistic, Table, Tag, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, SearchOutlined } from '@ant-design/icons'
import { IOrderBookRow, IStockData } from '../types'
import { COLOR_DOWN, COLOR_UP } from '../constants'
import { displayCode, formatPriceText } from '../utils/format'
import { CardSkeletonGrid } from './CardSkeletonGrid'
import { MonitorInfo } from './MonitorInfo'
import style from '../styles/index.module.less'
import orderbook from '../assets/svg/orderbook.svg'
import tonghuashun from '../assets/svg/tonghuashun.svg'
const { Title, Text } = Typography

/** 盘口表格列定义 */
const orderColumns = [
  {
    title: '买',
    dataIndex: 'buyPrice',
    key: 'buyPrice',
    render: (text: string): JSX.Element => (
      <span style={{ color: COLOR_UP }}>{formatPriceText(text)}</span>
    ),
  },
  { title: '量', dataIndex: 'buyVol', key: 'buyVol' },
  {
    title: '卖',
    dataIndex: 'sellPrice',
    key: 'sellPrice',
    render: (text: string): JSX.Element => (
      <span style={{ color: COLOR_DOWN }}>{formatPriceText(text)}</span>
    ),
  },
  { title: '量', dataIndex: 'sellVol', key: 'sellVol' },
]

/** 打开同花顺行情页（先尝试跳转 App，不可用则降级到网页版） */
function openTonghuashun(code: string): void {
  window.open(`https://stockpage.10jqka.com.cn/${code}/`, '_blank')
}

/** 个股看板属性 */
interface IStockBoardProps {
  list: IStockData[]
  loading: boolean
  /** 输入框中的股票代码字符串 */
  inputValue: string
  /** 搜索栏下方的监控数量与市场阶段文案 */
  statusText: string
  detailStock: IStockData | null
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearch: () => void
  onDetail: (stock: IStockData) => void
  onCloseDetail: () => void
}

/**
 * 个股看板
 * 代码输入栏 + 股票卡片栅格 + 五档盘口弹窗
 * 用 memo 包住：切 Tab / 其它数据源更新 / 时钟跳动都不必让它重渲染
 */
const StockBoard = memo(function StockBoard({
  list,
  loading,
  inputValue,
  statusText,
  detailStock,
  onInputChange,
  onSearch,
  onDetail,
  onCloseDetail,
}: IStockBoardProps): JSX.Element {
  // 尚无股票数据且在请求中（如首次进入/刚提交查询）：先铺骨架屏占位
  const showSkeleton: boolean = list.length === 0 && loading
  return (
    <>
      {/* 顶部搜索栏 */}
      <Card className={style.searchCard}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="输入代码，逗号分隔 (如: sz002335)"
              value={inputValue}
              onChange={onInputChange}
              onPressEnter={onSearch}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={onSearch}
              loading={loading}
            />
          </Col>
        </Row>
        {/* 状态行与指数看板同一套样式与排版，见 components/MonitorInfo（文案为空时自身不渲染） */}
        <MonitorInfo text={statusText} />
      </Card>

      {/* 股票列表网格（无数据且在请求中时展示骨架屏） */}
      {showSkeleton ? (
        <CardSkeletonGrid />
      ) : (
      <Row gutter={[8, 8]}>
        {list.map((stock: IStockData) => (
          <Col xs={24} lg={12} xl={8} key={stock.id}>
            <Card
              size="small"
              className={style.card}
              title={
                <div className={style.cardTitle}>
                  <span>
                    <Tag color="blue">{displayCode(stock.code)}</Tag>
                    <span className={style.stockName}>{stock.name}</span>
                  </span>
                </div>
              }
              extra={
                <>
                  <div
                    className={style.detailBtn}
                    onClick={(): void => onDetail(stock)}
                  >
                    <img src={orderbook} title="盘口" />
                  </div>
                  <div
                    className={style.detailBtn}
                    style={{ marginLeft: 12 }}
                    onClick={(e: React.MouseEvent<HTMLDivElement>): void => {
                      e.stopPropagation()
                      openTonghuashun(displayCode(stock.code))
                    }}
                  >
                    <img src={tonghuashun} title="同花顺 App" />
                  </div>
                </>
              }
            >
              {/* 更新时间 */}
              <Text
                type="secondary"
                className={style.updateTime}
                style={{ display: 'block', marginBottom: 8 }}
              >
                {stock.updateTime}
              </Text>
              {/* 关键指标 */}
              <div className={style.gridContainer}>
                {/* 最新价 & 涨跌幅 */}
                <div className={style.priceRow}>
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
                      ) : stock.isFlat ? (
                        <MinusOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )
                    }
                  />
                  <Text
                    className={style.changeAmt}
                    style={{ color: stock.color }}
                  >
                    {stock.changeAmt > 0 ? '+' : ''}
                    {stock.changeAmt.toFixed(2)}
                  </Text>
                </div>
                {/* 今开价 */}
                <div>
                  <Text type="secondary">今开</Text>
                  <br />
                  {stock.stats.open.toFixed(2)}
                </div>
                {/* 最低价 - 最高价 */}
                <div>
                  <Text type="secondary">最低/最高</Text>
                  <br />
                  {stock.stats.low.toFixed(2)} - {stock.stats.high.toFixed(2)}
                </div>
                {/* 昨收价 */}
                <div>
                  <Text type="secondary">昨收</Text>
                  <br />
                  {stock.stats.preClose.toFixed(2)}
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
            </Card>
          </Col>
        ))}
      </Row>
      )}

      {/* 五档盘口详情弹窗 */}
      <Modal
        title={
          detailStock
            ? `${detailStock.name} (${displayCode(
                detailStock.code
              )}) - 五档盘口`
            : '五档盘口'
        }
        open={!!detailStock}
        onCancel={onCloseDetail}
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
            ): string => (index % 2 === 0 ? '' : 'table-row-light-gray')}
          />
        )}
      </Modal>
    </>
  )
})

export {
  orderColumns,
  openTonghuashun,
  IStockBoardProps,
  StockBoard,
}
