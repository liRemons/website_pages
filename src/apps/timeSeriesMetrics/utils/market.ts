/**
 * 行情时间阶段与单只指数活跃度判断
 * 1. 沪深港看板共用的交易阶段（盘前/集合竞价/盘中/午间休市/盘后/休市）
 *    基于北京时间（UTC+8）：A股与港股交易时段不同，看板轮询窗口取两者并集
 *    依据 2026 年 7 月 6 日起施行的 A 股交易新规（收盘集合竞价 14:57-15:00、盘后固定价格交易 15:05-15:30）
 * 2. 单只指数的数据标识「更新中/已停更」：只看行情时间新不新，不依赖各市场时段表
 *    （港股源时间在腾讯接口里固定滞后约 15 分钟，由解析层换成本轮响应到达时间，见 parse.ts）
 * 3. 单只指数的时段标识「盘前/盘中/午休/盘后/休市」：按市场 IANA 时区取当地墙钟，夏令时自动跟随
 */

/** 市场阶段 */
export type BoardPhase = '盘前' | '集合竞价' | '盘中' | '午间休市' | '盘后' | '休市';

/** 市场阶段判断结果 */
export interface IBoardPhase {
  /** 阶段标识 */
  phase: BoardPhase;
  /** 界面展示文案 */
  label: string;
  /** 该阶段行情是否仍在变动，需要继续轮询 */
  active: boolean;
}

/** 港股开市前竞价开始（9:00） */
const HK_PRE_OPEN = 9 * 60;
/** A股开盘集合竞价开始（9:15） */
const AUCTION_START = 9 * 60 + 15;
/** 连续竞价开始（9:30） */
const MORNING_START = 9 * 60 + 30;
/** A股上午收市（11:30） */
const A_MORNING_END = 11 * 60 + 30;
/** 港股上午收市（12:00） */
const HK_MORNING_END = 12 * 60;
/** 下午开市（13:00） */
const AFTERNOON_START = 13 * 60;
/** A股收盘集合竞价开始（14:57） */
const A_CLOSING_AUCTION = 14 * 60 + 57;
/** A股收市（15:00，其后至 15:30 为盘后固定价格交易） */
const A_CLOSE = 15 * 60;
/** 港股收市（16:10，含收盘竞价时段） */
const HK_CLOSE = 16 * 60 + 10;

/**
 * 换算出北京时间的星期与当日分钟数
 * 浏览器时区非 UTC+8 时也能得到正确的市场时段判断
 */
function getBeijingClock(date: Date): { day: number; minutes: number } {
  const beijingTime = new Date(date.getTime() + (date.getTimezoneOffset() + 480) * 60000);
  return {
    day: beijingTime.getDay(), // 0=周日, 6=周六
    minutes: beijingTime.getHours() * 60 + beijingTime.getMinutes(),
  };
}

/**
 * 判断当前沪深港行情所处的阶段
 * 法定节假日休市无法由时钟推断，调用方按需再叠加交易日日历
 * @param date - 判断基准时间，默认当前时间
 * @returns 阶段标识、展示文案与是否需要继续轮询
 */
export function getBoardPhase(date = new Date()): IBoardPhase {
  const { day, minutes } = getBeijingClock(date);

  // 周末休市
  if (day === 0 || day === 6) {
    return { phase: '休市', label: '周末休市', active: false };
  }
  // 9:00 前：两地均未开市
  if (minutes < HK_PRE_OPEN) {
    return { phase: '盘前', label: '盘前', active: false };
  }
  // 9:00-9:15：港股开市前竞价，A股尚未进入集合竞价
  if (minutes < AUCTION_START) {
    return { phase: '集合竞价', label: '港股开市前竞价', active: true };
  }
  // 9:15-9:30：开盘集合竞价
  if (minutes < MORNING_START) {
    return { phase: '集合竞价', label: '开盘集合竞价', active: true };
  }
  // 9:30-11:30：上午连续竞价
  if (minutes < A_MORNING_END) {
    return { phase: '盘中', label: '上午盘中', active: true };
  }
  // 11:30-12:00：A股午间休市，港股仍在交易
  if (minutes < HK_MORNING_END) {
    return { phase: '午间休市', label: 'A股午间休市（港股交易中）', active: true };
  }
  // 12:00-13:00：两地午间休市
  if (minutes < AFTERNOON_START) {
    return { phase: '午间休市', label: '午间休市', active: false };
  }
  // 13:00-14:57：下午连续竞价
  if (minutes < A_CLOSING_AUCTION) {
    return { phase: '盘中', label: '下午盘中', active: true };
  }
  // 14:57-15:00：A股收盘集合竞价
  if (minutes <= A_CLOSE) {
    return { phase: '盘中', label: 'A股收盘集合竞价', active: true };
  }
  // 15:00-16:10：A股已收（含盘后固定价格交易），港股仍在交易
  if (minutes < HK_CLOSE) {
    return { phase: '盘后', label: 'A股已收盘（港股交易中）', active: true };
  }
  // 收盘之后
  return { phase: '休市', label: '已收盘', active: false };
}

/** 单只指数的数据活跃状态标识（看行情新不新，与时段无关） */
export type QuoteStatus = '更新中' | '已停更' | '未知';

/** 判定为「更新中」的行情时间窗口（毫秒），超出即视为该市场已停更 */
export const QUOTE_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

/**
 * 将腾讯的紧凑行情时间（yyyyMMddHHmmss，北京时间）转为绝对毫秒时间戳
 * 港股等市场的时间串带分隔符（2026/10/28 16:08:32），先去掉非数字再解析
 * 按 UTC+8 组装，浏览器时区不是北京时间时也不会算偏
 * @param text - 行情时间串
 * @returns 毫秒时间戳，无法解析时返回 0
 */
export function parseBeijingCompactTime(text: string): number {
  const digits: string = String(text === undefined || text === null ? '' : text).replace(
    /\D/g,
    ''
  );
  if (digits.length !== 14) {
    return 0;
  }
  const utcMs: number = Date.UTC(
    Number(digits.slice(0, 4)),
    Number(digits.slice(4, 6)) - 1,
    Number(digits.slice(6, 8)),
    Number(digits.slice(8, 10)),
    Number(digits.slice(10, 12)),
    Number(digits.slice(12, 14))
  );
  return Number.isFinite(utcMs) ? utcMs - 8 * 60 * 60 * 1000 : 0;
}

/**
 * 根据行情时间判断单个指数当前是否仍在交易
 * 好处是各市场时区、夏令时、节假日休市、临时停市都不需要逐个维护时段表：
 * 行情时间在窗口内就是活跃，否则就是休市或无更新
 * @param quoteAt - 行情时间对应的毫秒时间戳，0 表示上游未给时间
 * @param now - 当前时间毫秒时间戳
 * @returns 数据活跃状态标识
 */
export function getQuoteStatus(quoteAt: number, now: number): QuoteStatus {
  if (!Number.isFinite(quoteAt) || quoteAt <= 0) {
    return '未知';
  }
  // 时间戳略快于本地时钟（上下游时钟偏差）时差值为负，同样归入活跃
  return now - quoteAt <= QUOTE_ACTIVE_WINDOW_MS ? '更新中' : '已停更';
}

/** 板块级行情活跃状态：有指数在更新 / 全部停更 / 时间戳不可判定 */
export type ActivityState = 'active' | 'idle' | 'unknown';

/**
 * 汇总一批指数的行情时间，判断该板块当前是否仍有数据在变动
 * 用于把轮询从「按时钟猜交易时段」改为「看数据是否真的在更新」
 * @param quoteAtList - 各指数行情时间的毫秒时间戳（不可解析为 0）
 * @param now - 当前时间毫秒时间戳
 * @returns active 有指数在更新；idle 全部停更；unknown 时间戳不可用（列表为空或均无行情时间）
 */
export function judgeActivity(quoteAtList: number[], now: number): ActivityState {
  const stamps: number[] = quoteAtList.filter(
    (at: number) => Number.isFinite(at) && at > 0
  );
  if (stamps.length === 0) {
    return 'unknown';
  }
  return stamps.some((at: number) => now - at <= QUOTE_ACTIVE_WINDOW_MS)
    ? 'active'
    : 'idle';
}

/** 市场时段标识（由该交易所的官方时段表得出，与数据是否在动无关） */
export type SessionPhase = '盘前' | '盘中' | '午休' | '盘后' | '休市';

/** 单个交易时段区间，以市场当地时间的分钟数表示，左闭右开 */
export interface ISessionRange {
  phase: SessionPhase;
  /** 开始分钟数，如 09:30 为 570 */
  from: number;
  /** 结束分钟数 */
  to: number;
}

/** 市场交易时段定义 */
export interface ISessionSpec {
  /** 悬停文案里的交易所所在地，如「纽约」 */
  place: string;
  /** IANA 时区名，夏令时交由 Intl 处理，不需手工维护偏移 */
  tz: string;
  /** 当日时段表，按顺序匹配，未命中即视为休市 */
  ranges: ISessionRange[];
}

/** 市场时段判断结果 */
export interface ISessionState {
  /** 时段标识 */
  phase: SessionPhase;
  /** 悬停说明，如「盘前（纽约当地 04:00-09:30）」 */
  text: string;
}

/** en-GB 短星期名到 0-6 的映射 */
const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Intl 格式化器按 tz 复用，避免每张卡片每轮重复创建 */
const clockFormatters: Map<string, Intl.DateTimeFormat> = new Map();

/** 换算出指定时区的星期与当日分钟数 */
function getZoneClock(tz: string, date: Date): { day: number; minutes: number } {
  let formatter: Intl.DateTimeFormat | undefined = clockFormatters.get(tz);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour12: false,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      clockFormatters.set(tz, formatter);
    } catch (error) {
      // 兜底：老引擎不认该时区时退回北京时间口径（与沪深模型一致）
      const beijing: Date = new Date(
        date.getTime() + (date.getTimezoneOffset() + 480) * 60000
      );
      return {
        day: beijing.getDay(),
        minutes: beijing.getHours() * 60 + beijing.getMinutes(),
      };
    }
  }
  const parts: Intl.DateTimeFormatPart[] = formatter.formatToParts(date);
  const pick: (type: string) => string = (type: string) => {
    const hit: Intl.DateTimeFormatPart | undefined = parts.find(
      (part: Intl.DateTimeFormatPart) => part.type === type
    );
    return hit ? hit.value : '';
  };
  const weekdayName: string = pick('weekday').replace('.', '');
  const mapped: number = WEEKDAY_MAP[weekdayName];
  // hour12:false 在部分引擎里会给出 24，取模归一到 0
  const hour: number = Number(pick('hour')) % 24;
  const minute: number = Number(pick('minute'));
  return {
    day: Number.isFinite(mapped) ? mapped : date.getDay(),
    minutes: hour * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

/** 当日分钟数格式化为 HH:MM */
function formatMinutes(min: number): string {
  const hour: number = Math.floor(min / 60);
  const minute: number = min % 60;
  return `${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}`;
}

/**
 * 判断某市场此刻处于哪个交易时段
 * 时区名 + 当地时段表的组合好处是夏令时、半时区（印度 +5:30）自动正确，
 * 无需手工维护“北京时间偏移”的对照表
 * 时段表只用于展示，不参与轮询决策：错了也只是标签不准，不会漏数据；
 * 半日市与临时休市不建模，会由「已停更」标识暴露出来
 * @param spec - 市场时段定义，未配置时返回 null（不展示时段标签）
 * @param date - 基准时间
 * @returns 时段标识与悬停说明
 */
export function getMarketSession(
  spec: ISessionSpec | undefined,
  date: Date
): ISessionState | null {
  if (!spec) {
    return null;
  }
  const { day, minutes } = getZoneClock(spec.tz, date);
  if (day === 0 || day === 6) {
    return { phase: '休市', text: `${spec.place}周末休市` };
  }
  const hit: ISessionRange | undefined = spec.ranges.find(
    (range: ISessionRange) => minutes >= range.from && minutes < range.to
  );
  if (!hit) {
    return {
      phase: '休市',
      text: `${spec.place}当地 ${formatMinutes(minutes)}，非交易时段`,
    };
  }
  return {
    phase: hit.phase,
    text: `${hit.phase}（${spec.place}当地 ${formatMinutes(hit.from)}-${formatMinutes(
      hit.to
    )}）`,
  };
}
