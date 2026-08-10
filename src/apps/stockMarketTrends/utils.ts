/**
 * 判断当前 A 股所处的交易状态
 * 基于北京时间（UTC+8），适用于 2026 年 7 月 6 日起施行的 A 股交易新规
 */
function getAStockStatus(date = new Date()) {
  // 将当前时间转换为北京时间
  const beijingTime = new Date(date.getTime() + (date.getTimezoneOffset() + 480) * 60000);
  const day = beijingTime.getDay(); // 0=周日, 6=周六
  const hours = beijingTime.getHours();
  const minutes = beijingTime.getMinutes();
  const time = hours * 60 + minutes; // 转为当天分钟数，便于比较

  // 周末休市
  if (day === 0 || day === 6) {
    return { status: '休市', label: '周末休市' };
  }

  // 各时段判断（单位：分钟）
  if (time >= 9 * 60 + 15 && time < 9 * 60 + 25) {
    return { status: '开盘集合竞价', label: '开盘集合竞价（9:15-9:25）' };
  }
  if (time >= 9 * 60 + 30 && time < 11 * 60 + 30) {
    return { status: '交易中', label: '上午连续竞价（9:30-11:30）' };
  }
  if (time >= 11 * 60 + 30 && time < 13 * 60) {
    return { status: '午间休市', label: '午间休市（11:30-13:00）' };
  }
  if (time >= 13 * 60 && time < 14 * 60 + 57) {
    return { status: '交易中', label: '下午连续竞价（13:00-14:57）' };
  }
  if (time >= 14 * 60 + 57 && time <= 15 * 60) {
    return { status: '收盘集合竞价', label: '收盘集合竞价（14:57-15:00）' };
  }
  if (time >= 15 * 60 + 5 && time <= 15 * 60 + 30) {
    return { status: '盘后交易', label: '盘后固定价格交易（15:05-15:30）' };
  }

  // 其余时间（如 9:00 前、15:30 后等）
  return { status: '休市', label: '非交易时段' };
}

/**
 * 判断当前是否已收盘（含盘后交易）
 */
export function isAfterClose(date = new Date()) {
  const result = getAStockStatus(date);
  // 收盘集合竞价及之后均视为"已收盘"
  return ['收盘集合竞价', '盘后交易', '休市'].includes(result.status)
    && getAStockStatus(date).status !== '午间休市';
}
