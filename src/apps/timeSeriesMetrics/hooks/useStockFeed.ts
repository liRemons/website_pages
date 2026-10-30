/**
 * 个股行情数据源
 * 输入框内容与已提交代码分离（输入过程不发请求），按市场阶段决定是否轮询；
 * 提交时代码未变化则手动补发一次，因为 effect 不会因相同代码重跑
 */

import React, { useCallback, useEffect, useState } from 'react'
import { service } from '@axios'
import { IQuoteTextResult, IStockData } from '../types'
import { QUOTE_API_URL } from '../constants'
import { DEFAULT_STOCK_CODES, saveStockCodes } from '../utils/prefs'
import { parseOneStock } from '../utils/parse'

interface IStockFeedArgs {
  /** 是否为当前激活 Tab */
  enabled: boolean
  /** 市场阶段决定的轮询间隔，0 表示当前阶段不轮询 */
  intervalMs: number
}

interface IStockFeedState {
  /** 输入框中的股票代码字符串 */
  inputValue: string
  /** 实际参与查询与轮询的股票代码 */
  activeCodes: string
  /** 解析后的股票数据列表 */
  list: IStockData[]
  loading: boolean
  /** 提交输入框内容作为查询条件 */
  search: () => void
  /** 输入框值变更 */
  changeInput: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function useStockFeed(args: IStockFeedArgs): IStockFeedState {
  const { enabled, intervalMs } = args
  const [inputValue, setInputValue] = useState<string>(DEFAULT_STOCK_CODES)
  const [activeCodes, setActiveCodes] = useState<string>(DEFAULT_STOCK_CODES)
  const [list, setList] = useState<IStockData[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  /** 从行情接口获取个股数据（入参/出参走统一加盐加解密） */
  const fetchStock = useCallback(async (codes: string): Promise<void> => {
    if (!codes) {
      return
    }
    setLoading(true)
    try {
      const res = (await service({
        method: 'get',
        url: QUOTE_API_URL,
        params: { codes },
      })) as IQuoteTextResult
      if (!res.success) {
        throw new Error(res.msg || '行情查询失败')
      }
      // 按分号分割多只股票数据，过滤空行后逐行解析
      const lines: string[] = res.data
        .split(';')
        .filter((line: string) => line.trim().length > 0)
      const parsedData: IStockData[] = lines
        .map(parseOneStock)
        .filter(
          (item: IStockData | null): item is IStockData => item !== null
        )
      setList(parsedData)
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 仅按已提交的代码查询；代码未变时不重建定时器，也不感知输入框的逐字变化
  // 进入 Tab 立即取一次数（有旧数据直接刷新），再按阶段间隔轮询
  useEffect(() => {
    if (!enabled || !activeCodes) {
      return
    }
    fetchStock(activeCodes)
    if (!intervalMs) {
      return
    }
    const timer = setInterval(() => fetchStock(activeCodes), intervalMs)
    return () => clearInterval(timer)
  }, [enabled, activeCodes, intervalMs, fetchStock])

  /**
   * 点击查询按钮或按回车时提交查询
   * 写入 localStorage 并更新查询代码，由上面的 effect 销毁旧定时器并重建
   */
  const search = useCallback((): void => {
    const codes: string = inputValue.trim()
    saveStockCodes(codes)
    if (codes === activeCodes) {
      fetchStock(codes)
      return
    }
    setActiveCodes(codes)
  }, [activeCodes, fetchStock, inputValue])

  const changeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setInputValue(e.target.value)
    },
    []
  )

  return { inputValue, activeCodes, list, loading, search, changeInput }
}

export {
  IStockFeedArgs,
  IStockFeedState,
  useStockFeed,
}
