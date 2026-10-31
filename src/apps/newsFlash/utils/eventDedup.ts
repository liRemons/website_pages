/**
 * SSE 推送的去重/更新折叠规则（与 useNewsFeed 状态解耦，便于单测与复现脚本直接引用）
 * 三条规则按 R2 → R1 → R3 顺序判定，全部不命中才作为新条目：
 * - R2 同 id 重推      → 就地替换（展示签名判等短路无变化重渲染），保留原位置/原时间戳/原高亮态
 * - R1 跨 id 同标题    → 同 type + 非空标题、10 分钟内：同事件改写，跨 id 就地替换到原条目位置、保留原时间戳
 * - R3 跨 id 同正文    → 同 type + content_text、10 分钟内：换标题加图不改正文等补发，同样就地替换、保留原时间戳
 * - 不命中              → 登记事件槽 → 交调用方按 displayTime 倒序插入（晚到的新条目也能入列，不再按 id 丢弃）
 * 服务端纯转发不去重，上游同一条的修订会带着新 id 重发，识别更新只能靠这三条规则
 */

interface IEventOcc {
  /** 当前占用该事件槽的条目 id */
  id: number
  /** 事件首次展示时间（毫秒），跨 id 更新时保留，供窗口判定 */
  t: number
}

interface IFeedCtx {
  /** 已收录条目 id，用于列表/推送交叉去重 */
  ids: Set<number>
  /** 标题事件键（type+非空标题）-> 事件槽占用者 */
  titleRef: Map<string, IEventOcc>
  /** 正文事件键（type+content_text）-> 事件槽占用者 */
  contentRef: Map<string, IEventOcc>
  /** 已看到的最大条目 id（仅作增量登记；已不作丢弃判据，晚到条目改按 displayTime 倒序插回） */
  maxId: number
}

type IItemsUpdater = (updater: (prev: any[]) => any[]) => void

/**
 * 同一事件的判定窗口（毫秒）：标题或正文命中同事件键、且两条展示时间相距不足 10 分钟，才认作同一事件的重发/改写
 * 超出窗口的同标题（如隔了几小时的再次播报）视为不同事件，各自保留
 */
const EVENT_DUP_WINDOW_MS = 10 * 60 * 1000

/**
 * 标题事件键：type + 非空标题（trim 后）
 * 空标题（典型如 7×24 live）不生成标题键，避免所有空标题互相误合并，由正文键兜住去重
 */
function titleKeyOf(item: { title: string; type: string }): string | null {
  const name: string = item.title.trim()
  if (!name) return null
  return `${item.type}\u0001${name}`
}

/**
 * 正文事件键：type + 非空 content_text（trim 后）
 * 用 content_text 而非 HTML content：上游"补发时只加图/改标题"场景里，HTML 会变但纯文本正文不变，仍能回到原事件槽
 */
function contentKeyOf(item: { contentText: string; type: string }): string | null {
  const name: string = item.contentText.trim()
  if (!name) return null
  return `${item.type}\u0001${name}`
}

/** 两条展示时间是否超出同事件窗口（任一时间无效则不参与窗口比较，按同一事件处理） */
function beyondEventWindow(a: number, b: number): boolean {
  return a > 0 && b > 0 && Math.abs(a - b) > EVENT_DUP_WINDOW_MS
}

/**
 * 展示签名：涵盖会影响渲染的字段（忽略 isNew），用于判断同 id 推送是否为真实变化
 * 服务端不去重、纯转发，上游可能重发一模一样的帧，靠本签名在就地更新时短路掉无变化的重渲染
 * channels 必纳入：板块类型标签由 channels 经 typeLabelsOfChannels 得出，否则只改频道的二次推送会被当成无变化短路掉、标签不更新
 */
function displaySig(item: any): string {
  return [
    item.type,
    item.title,
    item.contentHtml,
    item.contentText,
    item.contentMore,
    item.score,
    item.uri,
    item.calendarKey,
    item.channels,
    item.images.join(','),
    item.article ? item.article.uri + item.article.title : '',
  ].join('\u0001')
}

/** 空的去重上下文（首屏/筛选切换时重置用） */
function createFeedCtx(): IFeedCtx {
  return { ids: new Set(), titleRef: new Map(), contentRef: new Map(), maxId: 0 }
}

/**
 * 收集未见过的条目并同步去重集合与最大 id，返回增量（首屏/翻页/在途重放共用）
 * 三道去重：1）按 id；2）按标题键（窗口内同标题视为同一事件重发）；3）按正文键（窗口内同正文视为跨 id 改写）
 * 命中任一重发窗口→丢弃后来者、保留先入者（列表按新→旧顺序，先入即较新）
 */
function collectItems(ctx: IFeedCtx, list: any[]): any[] {
  const fresh: any[] = []
  list.forEach((item: any) => {
    if (!item.id || ctx.ids.has(item.id)) return
    const t: number = item.displayTime > 0 ? item.displayTime : Date.now()
    const tk: string | null = titleKeyOf(item)
    if (tk) {
      const occ: IEventOcc | undefined = ctx.titleRef.get(tk)
      if (occ && !beyondEventWindow(occ.t, item.displayTime)) return
    }
    const ck: string | null = contentKeyOf(item)
    if (ck) {
      const occ: IEventOcc | undefined = ctx.contentRef.get(ck)
      if (occ && !beyondEventWindow(occ.t, item.displayTime)) return
    }
    if (tk) ctx.titleRef.set(tk, { id: item.id, t })
    if (ck) ctx.contentRef.set(ck, { id: item.id, t })
    ctx.ids.add(item.id)
    if (item.id > ctx.maxId) ctx.maxId = item.id
    fresh.push(item)
  })
  return fresh
}

/**
 * 按 displayTime 倒序（新→旧）插入一条新条目，返回新数组；同 id 已在列表中则原样返回
 * 取代原先的「无脑置顶 + id ≤ maxId 丢弃」：上游 id 只是自增号，与展示时间、到达顺序都不严格对应，
 * 晚到的旧条目插回它该有的时间位置，既不丢数据也不破坏倒序；正常最新条目仍落在首位（与置顶等效）
 * @param prev - 当前列表（已按 displayTime 倒序）
 * @param item - 待插入条目（调用方已挂好 isNew 等展示字段）
 */
function insertByDisplayTimeDesc(prev: any[], item: any): any[] {
  if (prev.some((p: any) => p.id === item.id)) return prev
  const t: number = item.displayTime > 0 ? item.displayTime : Date.now()
  const next: any[] = prev.slice()
  let idx: number = 0
  // 跳过所有不早于本条时间的条目，插到第一个比它旧的条目之前；时间相等时排在后面，不打乱同批推送的既有顺序
  while (idx < next.length) {
    const curT: number = next[idx].displayTime > 0 ? next[idx].displayTime : 0
    if (curT < t) break
    idx += 1
  }
  next.splice(idx, 0, item)
  return next
}

/**
 * 处理一条 SSE 推送（R2→R1→R3→新增），列表变更经 setItems 走 React 函数式更新
 * @returns 是否作为新条目收录（调用方据此计数/高亮/通知），就地折叠与丢弃均返回 false
 */
function applySsePush(ctx: IFeedCtx, setItems: IItemsUpdater, item: any): boolean {
  // R2：同 id 已在列表中（同一条的修订带着新内容再次到达），就地替换、保留原位置/时间戳/高亮态
  // 展示签名判等：内容没变就返回原 prev 引用（React 跳过重渲染）；同 id 重推必须优先于一切跨 id 折叠
  if (ctx.ids.has(item.id)) {
    setItems((prev: any[]) => {
      const idx: number = prev.findIndex((p: any) => p.id === item.id)
      if (idx < 0) return prev
      const old: any = prev[idx]
      if (displaySig(old) === displaySig(item)) return prev
      const next: any[] = prev.slice()
      next[idx] = { ...item, displayTime: old.displayTime, isNew: old.isNew }
      return next
    })
    return false
  }
  // R1：跨 id 同标题就地更新——同 type+非空标题、窗口内已有一条在列表（如 15:00 先发简版、15:01 再发带图更全的版本）
  // 跨 id 改写必须排在新增判定之前：这类条目 id 可能大于 maxId，若不折回事件槽就会另起一条
  const tk: string | null = titleKeyOf(item)
  const tOcc: IEventOcc | undefined = tk ? ctx.titleRef.get(tk) : undefined
  if (tk && tOcc && tOcc.id !== item.id && !beyondEventWindow(tOcc.t, item.displayTime)) {
    setItems((prev: any[]) =>
      prev.map((p: any) =>
        p.id === tOcc.id
          ? displaySig(p) === displaySig(item)
            ? p
            : { ...item, displayTime: p.displayTime, isNew: p.isNew }
          : p
      )
    )
    // 事件槽占用者改为新 id，t 保留原事件时间，后续同标题推送仍能命中本槽；正文键同步改指
    ctx.titleRef.set(tk, { id: item.id, t: tOcc.t })
    const ckNew: string | null = contentKeyOf(item)
    if (ckNew) ctx.contentRef.set(ckNew, { id: item.id, t: tOcc.t })
    ctx.ids.add(item.id)
    if (item.id > ctx.maxId) ctx.maxId = item.id
    return false
  }
  // R3：跨 id 同正文就地更新——同 type+content_text、窗口内已有一条（标题不同但正文一样的补发、换标题加图不改正文等）
  const ck: string | null = contentKeyOf(item)
  const cOcc: IEventOcc | undefined = ck ? ctx.contentRef.get(ck) : undefined
  if (ck && cOcc && cOcc.id !== item.id && !beyondEventWindow(cOcc.t, item.displayTime)) {
    setItems((prev: any[]) =>
      prev.map((p: any) =>
        p.id === cOcc.id
          ? displaySig(p) === displaySig(item)
            ? p
            : { ...item, displayTime: p.displayTime, isNew: p.isNew }
          : p
      )
    )
    ctx.contentRef.set(ck, { id: item.id, t: cOcc.t })
    if (tk) ctx.titleRef.set(tk, { id: item.id, t: cOcc.t })
    ctx.ids.add(item.id)
    if (item.id > ctx.maxId) ctx.maxId = item.id
    return false
  }
  // 不设「id ≤ maxId 即丢弃」的乱序护栏：id 与展示时间、到达顺序都不严格对应，
  // 上游会先推 id 大的再补推 id 小的（不同频道/发布管线/晚 publish 的稿子），
  // 而「id ≤ maxId」并不代表这条已收录过——是否重复已由 R2（ctx.ids.has）与 R1/R3 折叠覆盖，
  // 能走到这里说明确属没见过的新条目，丢弃就会永久漏显（晚到的 create 帧 id 小于已见 maxId 即此走位）
  const fresh: any[] = collectItems(ctx, [item])
  if (fresh.length === 0) {
    return false
  }
  // 新条目由调用方按 insertByDisplayTimeDesc 插入并标记高亮（本函数不感知 isNew/插入位置语义）
  return true
}

export {
  EVENT_DUP_WINDOW_MS,
  IEventOcc,
  IFeedCtx,
  applySsePush,
  beyondEventWindow,
  collectItems,
  contentKeyOf,
  createFeedCtx,
  displaySig,
  insertByDisplayTimeDesc,
  titleKeyOf,
}
