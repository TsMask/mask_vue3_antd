import { request } from '@/plugins/http-fetch';

/**
 * 定时任务调度日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportJobLog(
  query: Record<string, any>
) {
  return request({
    url: '/monitor/job/log/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询调度日志列表
 * @param query 查询参数
 * @returns object
 */
export function listJobLog(query: Record<string, any>) {
  return request({
    url: '/monitor/job/log/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 删除调度日志
 * @param jobLogId 任务日志Id
 * @returns object
 */
export function delJobLog(jobLogId: string) {
  return request({
    url: `/monitor/job/log/${jobLogId}`,
    method: 'DELETE',
  });
}

/**
 * 清空调度日志
 * @returns object
 */
export function cleanJobLog() {
  return request({
    url: '/monitor/job/log/clean',
    method: 'DELETE',
  });
}
