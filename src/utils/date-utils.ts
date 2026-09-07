// 依赖来源 https://github.com/iamkun/dayjs
import dayjs from 'dayjs';

// 导入本地化语言并设为默认使用，全局有引入就行
// import('dayjs/locale/zh-cn');
// dayjs.locale('zh-cn');

/**
 * 格式时间字符串
 * @param dateStr 时间字符串
 * @param formatStr 时间格式 默认YYYY-MM-DD HH:mm:ss
 * @returns Date对象
 */
export function parseStrToDate(
  dateStr: string,
  formatStr: string = 'YYYY-MM-DD HH:mm:ss'
): Date {
  return dayjs(dateStr, formatStr).toDate();
}

/**
 * 格式时间
 * @param date 可转的Date对象
 * @param formatStr 时间格式 默认YYYY-MM-DD HH:mm:ss
 * @returns 时间格式字符串
 */
export function parseDateToStr(
  date: string | number | Date,
  formatStr: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  return dayjs(date).format(formatStr);
}

/**
 * 格式时间成日期路径
 *
 * 年/月 列如：2022/12
 * @returns 时间格式字符串 YYYY/MM
 */
export function parseDatePath(date: number | Date = Date.now()): string {
  return dayjs(date).format('YYYY/MM');
}

/**
 * 判断两次时间差
 * @param endDate 结束时间
 * @param startDate 开始时间
 * @returns 单位秒
 */
export function diffSeconds(
  endDate: number | Date,
  startDate: number | Date
): number {
  const value = Math.ceil(dayjs(endDate).diff(startDate, 'seconds'));
  if (Number.isNaN(value)) return 0;
  return value;
}
