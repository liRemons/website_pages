/**
 * 资讯上游原始结构解析
 * 服务端已改为「纯透传 + 只加盐」：不再逐字段规整，直接回上游 lives item / WS 推送 content 原样，
 * 二者字段名一致（均为 snake_case）。因此这里集中做一层解析，以后上游新增字段只动本文件即可。
 * 注意：值经加盐链路解密后叶子均为字符串，数值字段走 toNumber；channels/images 为数组，author 为嵌套对象。
 */

import { INewsArticle, INewsItem } from '../types'
import { toNumber } from './format'

/** 去除 HTML 标签与常见实体，把富文本转为可读纯文本（块级标签转换行，保留段落） */
function stripTags(html: unknown): string {
  return String(html == null ? '' : html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|ul|ol|tr|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // 段落之间只保留一个换行（不插空行），避免 pre-wrap 下行间距过大
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** 提取配图 URL 列表：上游 images 可能是字符串数组或对象数组（uri/thumbnail/url 任一键为地址） */
function extractImages(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return []
  }
  return images
    .map((img: unknown) =>
      typeof img === 'string'
        ? img
        : ((img as Record<string, unknown> || {}).uri as string) ||
          ((img as Record<string, unknown> || {}).thumbnail as string) ||
          ((img as Record<string, unknown> || {}).url as string) ||
          ''
    )
    .filter(Boolean)
}

/**
 * 提取关联文章：上游 article 为嵌套对象（title/uri），无或非对象时回 null
 * 只取展示必需的两个字段，uri 必须是 http(s) 绝对地址才放行，防 javascript: 等伪协议
 */
function extractArticle(article: unknown): INewsArticle | null {
  if (!article || typeof article !== 'object') {
    return null
  }
  const raw = article as Record<string, unknown>
  const uri: string = String(raw.uri || '')
  if (!/^https?:\/\//i.test(uri)) {
    return null
  }
  return {
    title: stripTags(raw.title),
    uri,
  }
}

/**
 * 正文 HTML 安全清洗（配合 dangerouslySetInnerHTML 使用）：
 * - 整段剔除 script/iframe/style 等危险标签及其内容
 * - 剔除 on* 事件属性与 javascript: 伪协议 href
 * - 块级排版标签拍平为行内流：p 换成 span，其余块级边界（div/li/h1-6/表格等）换成 \n，
 *   保证国旗+标题+正文同处一个行内流（行夹叠容器里一旦出现块级盒子会被切成独立行盒），
 *   段落换行由正文容器的 pre-line 消费 \n 实现
 * 不引 DOMPurify 等额外依赖，上游为可信度较高的见闻快讯，白名单式正则够用
 */
function sanitizeNewsHtml(html: unknown): string {
  return String(html == null ? '' : html)
    .replace(/<\s*(script|iframe|style|object|embed|form|link|meta)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    // 未闭合的单标签（如 <script src=xx> 没有配对结束标签）也一律去掉
    .replace(/<\s*\/?(script|iframe|style|object|embed|form|link|meta)[^>]*>/gi, '')
    // 剔除 on* 内联事件属性（onclick=… / onerror='…' 等，带值与不带值两种写法）
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // 伪协议属性：带引号的只把值换成 #（不碰闭引号，不破坏标签结构），未加引号的连尾一起去掉
    .replace(/((?:href|src)\s*=\s*["'])\s*javascript:[^"']*/gi, '$1#')
    .replace(/(?:href|src)\s*=\s*javascript:[^\s>]+/gi, 'href="#"')
    // a 标签补 target=_blank，跳转开新页不顶掉看板
    .replace(/<a\s(?![^>]*target=)/gi, '<a target="_blank" ')
    // br 换成换行符，交给 pre-line 断行
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    // p 整对换成 span（保留段内行内样式与链接）
    .replace(/<\s*p[^>]*>/gi, '<span>').replace(/<\s*\/\s*p\s*>/gi, '</span>')
    // 其余块级标签（开/闭）换成换行符，作为段落/条目边界
    .replace(/<\s*\/?(div|ul|ol|li|blockquote|pre|h[1-6]|table|thead|tbody|tr|td|th|p|section|article|header|footer)[^>]*>/gi, '\n')
    // pre-line 下行首空格会参与折行，把断行符前后的空白与空行折叠成单个 \n
    .replace(/[ \t\u3000]*(?:\r?\n)+[ \t\u3000]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/**
 * 把一条上游原始快讯（列表 item 或推送 content，snake_case）转成 INewsItem
 * @param raw - 解密后的上游原始对象
 * @returns 前端展示用条目
 */
function normalizeNewsItem(raw: Record<string, unknown>): INewsItem {
  const displaySec: number = toNumber(raw.display_time as string | number)
  const author: Record<string, unknown> | undefined = raw.author as
    | Record<string, unknown>
    | undefined
  return {
    id: toNumber(raw.id as string | number),
    title: String(raw.title || ''),
    // 正文优先用上游 content_text；万一只有 HTML 则去标签并保留段落换行
    contentText: stripTags(raw.content_text || raw.content),
    contentHtml: String(raw.content || ''),
    // 展开正文：content_more 为 HTML，去标签后作可展开补充内容（无则为空串）
    contentMore: stripTags(raw.content_more),
    // 统一成毫秒时间戳，前端按此展示时刻
    displayTime: displaySec ? displaySec * 1000 : 0,
    uri: String(raw.uri || ''),
    channels: Array.isArray(raw.channels)
      ? (raw.channels as unknown[]).map(String).join(',')
      : String(raw.channels || ''),
    authorName: String((author && author.display_name) || ''),
    type: String(raw.type || 'live'),
    // 上游 score=2 表示重点快讯，前端标红
    score: toNumber(raw.score as string | number),
    images: extractImages(raw.images),
    // 财经日历关联：上游带 calendar_key 的条目需在展示时另拉今值/预期/前值/国旗
    calendarKey: String(raw.calendar_key || ''),
    calendarType: String(raw.calendar_type || 'FD'),
    // 关联文章：非空时展示「相关文章」入口，点击跳转原文 uri
    article: extractArticle(raw.article),
    isNew: false,
  }
}

/** HTML 文本转义（标题等纯文本拼入 innerHTML 前必须过一遍，防标签注入） */
function escapeHtml(text: string): string {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 拼正文行内 HTML：国旗 + 标题前缀 + 清洗后的正文 + 可选「展开/收起」开关
 * 全部走同一段 innerHTML 注入：容器是 -webkit-box（行夹叠）且正文可能以块级标签开头，
 * 拆开渲染时块级正文会把行内的国旗挤成独立行盒；拼成单一行内流后国旗与首行文字同排，
 * 开关带 data-toggle-id，由外层事件委托处理点击；class 名由调用方传入（CSS Modules 哈希类不在工具层引用）
 */
function buildExcerptHtml(args: {
  flagUri?: string
  flagClass?: string
  title?: string
  bodyHtml: string
  itemId?: number
  showToggle?: boolean
  expanded?: boolean
  toggleClass?: string
}): string {
  const parts: string[] = []
  if (args.flagUri) {
    parts.push(
      `<img class="${args.flagClass || ''}" src="${escapeHtml(args.flagUri)}" width="20" height="14" alt="" />`
    )
  }
  if (args.title) {
    parts.push(`【${escapeHtml(args.title)}】`)
  }
  parts.push(args.bodyHtml)
  if (args.showToggle && args.itemId) {
    parts.push(
      ` <a class="${args.toggleClass || ''}" data-toggle-id="${args.itemId}">${args.expanded ? '收起' : '展开'}</a>`
    )
  }
  return parts.join('')
}

/**
 * 生成日历指标的前端缓存键：同一 key 不同 type 上游数据可能不同，故一并纳入
 * @param item - 带 calendarKey 的快讯条目
 */
function calendarKeyOf(item: Pick<INewsItem, 'calendarKey' | 'calendarType'>): string {
  return item.calendarKey ? `${item.calendarKey}|${item.calendarType || 'FD'}` : ''
}

/** 日历数值展示：空串（未公布/无数据）回「--」，非空拼上单位 */
function formatCalendarValue(value: string, unit: string): string {
  const text: string = String(value == null ? '' : value).trim()
  return text ? `${text}${unit || ''}` : '--'
}

export {
  buildExcerptHtml,
  calendarKeyOf,
  escapeHtml,
  extractArticle,
  extractImages,
  formatCalendarValue,
  normalizeNewsItem,
  sanitizeNewsHtml,
  stripTags,
}
