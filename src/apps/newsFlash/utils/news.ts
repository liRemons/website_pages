/**
 * 资讯上游原始结构解析
 * 服务端已改为「纯透传 + 只加盐」：不再逐字段规整，直接回上游 lives item / WS 推送 content 原样，
 * 二者字段名一致（均为 snake_case）。因此这里集中做一层解析，以后上游新增字段只动本文件即可。
 * 注意：值经加盐链路解密后叶子均为字符串，数值字段走 toNumber；channels/images 为数组，author 为嵌套对象。
 * 配图字段上游有两种拼法：WS 推送 content 用 image_uris（字符串数组），lives 列表用 images，解析时都兼容。
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

/** 提取配图 URL 列表：兼容 image_uris/images 两种字段名，元素可能是字符串或对象（uri/thumbnail/url 任一键为地址） */
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

/** 带圈序号的样式类名（CSS Modules 哈希类由调用方传入，同 flagClass/toggleClass 的理由） */
interface ICircledClass {
  /** 圈内一位数字（①-⑨、⑴-⑼、❶-❾ 等） */
  base: string
  /** 圈内两位数字（⑩-⑳ 等），字形为装下两位数字把圈画得更大 */
  wide: string
  /** ㉑-㊿（CJK 符号块）：这批码位西文字体普遍不收，实际落到中文字体上按全角字身画圈，得再单独一档 */
  cjk?: string
}

/** 三套 Dingbats 圈号各自的「10」，圈内已是两位 */
const WIDE_DINGBATS: number[] = [0x277f, 0x2789, 0x2793]

/** ㉑-㉟（U+3251-325F）与 ㊱-㊿（U+32B1-32BF）；32-35 圈号 Unicode 本身未收录 */
function isCjkBlock(cp: number): boolean {
  return (cp >= 0x3251 && cp <= 0x325f) || (cp >= 0x32b1 && cp <= 0x32bf)
}

/**
 * 码位是否属于「圈内两位数」一档
 * 逐段列出而不取一个上限：每段圈号都是「1-9 连续 + 10-20 连续」，两段之间还夹着字母圈号
 */
function isWideCircled(cp: number): boolean {
  return (
    (cp >= 0x2469 && cp <= 0x2473) || // ⑩-⑳
    (cp >= 0x247d && cp <= 0x2487) || // ⑽-⒇（括号式）
    (cp >= 0x2491 && cp <= 0x249b) || // ⒑-⒙（点号式）
    (cp >= 0x24eb && cp <= 0x24f4) || // ⓫-⓴（实心圈）
    (cp >= 0x3251 && cp <= 0x325f) || // ㉑-㉟
    (cp >= 0x32b1 && cp <= 0x32bf) || // ㊱-㊿
    WIDE_DINGBATS.indexOf(cp) >= 0
  )
}

/** emoji keycap（数字 + U+FE0F? + 组合键帽 U+20E3，如 9️⃣）换成对应文本圈号，顺带去掉 emoji 呈现 */
function keycapToCircled(seq: string): string {
  const digit: number = Number(seq.charAt(0))
  return digit === 0 ? '⓪' : String.fromCharCode(0x2460 + digit - 1)
}

/**
 * 序号分三档取类名：一位数字 / 两位数字 / ㉑ 起的 CJK 符号块
 * 前两档同一字体，只差字号微调；第三档是换了字体（圈按全角字身画），同字号下明显偏大，
 * 不单独给一档就会在 20 以里正常、从 21 开始又探出来
 */
function circledClassOf(cp: number, cls: ICircledClass): string {
  if (isCjkBlock(cp)) {
    return cls.cjk || cls.wide
  }
  return isWideCircled(cp) ? cls.wide : cls.base
}

/**
 * 给带圈序号逐个包一层 span，把字体/字号交给样式钉住（样式见 .newsNum/.newsNumWide/.newsNumCjk）
 * 上游内容不受控，同一个视觉上的序号可能来自多套码位：文本圈号 U+2460-249B、
 * ⓪/实心圈/双圈 U+24EA-24FF、Dingbats U+2776-2793、CJK 符号块 ㉑-㊿（U+3251-325F / U+32B1-32BF），
 * 以及按 emoji 渲染、会大一整档还带底色的 keycap 序列；页面字体栈打头的 Inter 没有这些字形，
 * 每个字符各自回退就会让相邻两个圈落在不同字体上，表现就是「有的大有的小」
 * 替换按「标签整段跳过」处理：直接在整串上替换会把 span 插进标签属性里破坏结构；
 * 序号后面跟 U+FE0F（emoji 呈现选择符）时一起去掉，否则同一个圈号仍会被拉成 emoji 大一号
 */
function wrapCircledNumbers(html: string, cls: ICircledClass): string {
  return html.replace(
    /(<[^>]*>)|(\d\uFE0F?\u20E3)|([\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u3251-\u325F\u32B1-\u32BF])\uFE0F?/g,
    (whole: string, tag: string, keycap: string, circled: string): string => {
      if (tag) {
        return tag
      }
      const glyph: string = keycap ? keycapToCircled(keycap) : circled || ''
      if (!glyph) {
        return whole
      }
      return `<span class="${circledClassOf(glyph.codePointAt(0) || 0, cls)}">${glyph}</span>`
    }
  )
}

/**
 * 正文 HTML 安全清洗（配合 dangerouslySetInnerHTML 使用）：
 * - 整段剔除 script/iframe/style 等危险标签及其内容
 * - 剔除 on* 事件属性与 javascript: 伪协议 href
 * - 块级排版标签拍平为行内流：div/li/h1-6/表格等边界换成 \n，段落 <p> 原样保留（块级 + 段间距，见样式
 *   .newsExcerpt p），保证国旗+标题同处一个行内流，其余换行由正文容器的 pre-line 消费 \n 实现
 * - 传入 circled 时最后再给带圈序号包一层样式钩子（放最后做，前面已把标签拍平定型）
 * 不引 DOMPurify 等额外依赖，上游为可信度较高的见闻快讯，白名单式正则够用
 */
function sanitizeNewsHtml(html: unknown, circled?: ICircledClass): string {
  const flat: string = String(html == null ? '' : html)
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
    // 其余块级标签（开/闭）换成换行符，作为段落/条目边界（p 不在这里，段落标签整对保留）
    .replace(/<\s*\/?(div|ul|ol|li|blockquote|pre|h[1-6]|table|thead|tbody|tr|td|th|section|article|header|footer)[^>]*>/gi, '\n')
    // 段落标签保留为块级，但它前后的空白（源码里的缩进与换行、上一步由 div/li 换出的 \n）要一并吃掉：
    // 容器是 pre-line，这些残留换行会渲染成段落之间的空行，跟 <p> 自己的段间距叠成两份
    // 名字边界 (?![a-z0-9-]) 不能省：少了它 <pre>/<picture>/<progress> 这些 p 开头的标签会被当成 <p> 处理
    .replace(/\s*<p(?![a-z0-9-])([^>]*)>\s*/gi, '<p$1>')
    .replace(/\s*<\/p\s*>/gi, '</p>')
    // pre-line 下行首空格会参与折行，把断行符前后的空白与空行折叠成单个 \n
    .replace(/[ \t\u3000]*(?:\r?\n)+[ \t\u3000]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
  return circled ? wrapCircledNumbers(flat, circled) : flat
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
    images: extractImages(raw.image_uris !== undefined ? raw.image_uris : raw.images),
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
 * 同一段 innerHTML 注入：国旗与标题自己成一个行内流（同排），正文段落 <p> 保留块级，
 * 会被切成下面的独立行盒（标题因此不再跟正文首行同排，这是保留块级段落的代价）；
 * 没有标题时（无标题条目、弹窗内标题已提到头部）调用方会给正文多挂一个类，把首段改回行内，
 * 国旗就能和正文第一行同排（样式见 .newsExcerptNoTitle），这里不需要为它拼出不同的 HTML；
 * 开关带 data-toggle-id，由外层事件委托处理点击；class 名由调用方传入（CSS Modules 哈希类不在工具层引用）
 * 标题只给纯文字包一层 span，加粗交给样式（.newsTitle）：写死在文案里就没法按断点调，也不再拼【】括号
 * 开关不做定位（.newsToggle 只给手型），就留在行内流里跟在正文末尾：正文整段展示不做行数截断，
 * 没有 overflow 裁切会碰到它，因此这里也无需关心正文长度
 * 时刻不在这里拼：窄屏也走左侧时间列（样式上呈时间线形态），日期语义由列表顶部状态行统一给出
 * 标题里的带圈序号同样过一遍包 span（先 escapeHtml 再包：此时已无标签，不会碰到属性）：
 * 标题常用 ①② 做条目序号，不处理就会跟正文里的同一批字符大小不一致
 */
function buildExcerptHtml(args: {
  flagUri?: string
  flagClass?: string
  title?: string
  titleClass?: string
  bodyHtml: string
  itemId?: number
  showToggle?: boolean
  expanded?: boolean
  toggleClass?: string
  circled?: ICircledClass
}): string {
  const parts: string[] = []
  if (args.flagUri) {
    parts.push(
      `<img class="${args.flagClass || ''}" src="${escapeHtml(args.flagUri)}" width="20" height="14" alt="" />`
    )
  }
  if (args.title) {
    const titleText: string = escapeHtml(args.title)
    parts.push(
      `<span class="${args.titleClass || ''}">${args.circled ? wrapCircledNumbers(titleText, args.circled) : titleText}</span>`
    )
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
  wrapCircledNumbers,
}
