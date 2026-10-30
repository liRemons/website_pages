/**
 * 登录态校验
 * localStorage 里有 token 只能说明「曾经登录过」：token 过期、被顶号、改过密码之后它依然躺在原地，
 * 所以登录态一律以服务端 /user/verifyLogin 的返回为准，token 本身只当缓存键用。
 */

import { service } from '@axios'
import { USER_TOKEN } from './index'

// 同一次页面生命周期内只验一次：多个组件同时问，共用同一个请求和同一个结果
let verifiedToken: string | null = null
let verifiedResult: boolean = false
let pending: Promise<boolean> | null = null

/**
 * 请求服务端核验并收敛缓存状态
 * @param token 本次核验所针对的 token
 * @returns 是否处于有效登录态
 */
async function requestVerify(token: string): Promise<boolean> {
  try {
    const res = await service({
      method: 'post',
      url: '/user/verifyLogin',
      // 静默请求：不弹 loading、不弹提示，也不让它自己跳登录页（跳不跳由调用方决定）
      quiet: true,
    })
    const ok: boolean = !!res && res.success === true
    if (!ok) {
      // 服务端说没登录，token 已经没用了，留着只会让后续请求继续被 403 弹回登录页
      localStorage.removeItem(USER_TOKEN)
    }
    verifiedToken = token
    verifiedResult = ok
    return ok
  } catch (error) {
    const status: number | undefined = (error as { status?: number } | null)?.status
    if (status === 403) {
      // 403 = 服务端明确拒绝（过期 / 被顶号），同样清掉失效 token
      localStorage.removeItem(USER_TOKEN)
    }
    // 超时、断网属于「验不了」：既不清 token 也不写缓存，下次进页面再验一遍
    return false
  } finally {
    pending = null
  }
}

/**
 * 校验当前登录态是否仍然有效
 * - 没有 token：直接判定未登录，不发请求（未知访客零成本）
 * - 有 token 且与上次核验时一致：复用上次结果
 * - 服务端判定失效：清掉 token 后返回 false
 * @returns 是否处于有效登录态
 */
function verifyLogin(): Promise<boolean> {
  const token: string | null = localStorage.getItem(USER_TOKEN)
  if (!token) {
    return Promise.resolve(false)
  }
  if (token === verifiedToken) {
    return Promise.resolve(verifiedResult)
  }
  if (!pending) {
    pending = requestVerify(token)
  }
  return pending
}

export { verifyLogin }
