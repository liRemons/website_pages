/**
 * 登录态校验 hook
 * 未登录时跳转登录页，并把当前页面路径与查询参数原样带回，保证深链（?codes= / ?tab=）不丢
 */

import { useEffect, useState } from 'react'
import isLogin from '@utils/isLogin'
import { openApp } from '@utils/nav'

/**
 * 登录态与跳转编排
 * @returns 是否已登录，未登录时页面不渲染内容
 */
function useLoginGuard(): boolean {
  const [authed] = useState<boolean>(() => isLogin())
  useEffect(() => {
    if (authed) {
      return
    }
    // 归一化为站内路由路径 /<页面名> + 原查询参数，
    // 登录页 openApp 在 App（../<页面名>）与 H5 环境下均可正确解析回跳
    const nameMatch = window.location.pathname.match(
      /\/(?:dist\/)?([A-Za-z][\w-]*)\//
    )
    const from = nameMatch
      ? `/${nameMatch[1]}${window.location.search}`
      : `${window.location.pathname}${window.location.search}`
    openApp({ url: `/login?from=${encodeURIComponent(from)}` })
  }, [authed])
  return authed
}

export {
  useLoginGuard,
}
