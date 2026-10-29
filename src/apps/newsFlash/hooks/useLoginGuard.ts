/**
 * 登录态校验 hook
 * 以服务端 verifyLogin 的结果为准（token 存在 ≠ 登录有效，过期后同样要跳登录页），
 * 未登录时跳转登录页，并把当前页面路径与查询参数原样带回，保证深链不丢；
 * URL 带 handleType=share（分享链接）时直接放行，让未登录访客也能看快讯
 */

import { useEffect, useState } from 'react'
import { getSearchParams } from 'methods-r'
import { verifyLogin } from '@utils/auth'
import { openApp } from '@utils/nav'

/** 校验中 / 已登录 / 未登录：校验中既不渲染内容，也不启动数据请求 */
type LoginStatus = 'checking' | 'authed' | 'anonymous'

/**
 * 登录态与跳转编排
 * @returns 是否放行渲染（已登录或分享链接），不放行时页面不渲染内容、也不启动数据请求
 */
function useLoginGuard(): boolean {
  // 分享链接放行：handleType 由 components/Fixed 的分享按钮写入 URL，进页后不再变化
  const shared: boolean = getSearchParams('handleType') === 'share'
  const [status, setStatus] = useState<LoginStatus>('checking')
  useEffect(() => {
    // 组件在请求返回前卸载时不要再 setState（该页面卸载即离开，无需继续校验）
    let alive: boolean = true
    verifyLogin().then((ok: boolean) => {
      if (!alive) {
        return
      }
      setStatus(ok ? 'authed' : 'anonymous')
    })
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    if (shared || status !== 'anonymous') {
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
  }, [shared, status])
  return shared || status === 'authed'
}

export {
  useLoginGuard,
}
