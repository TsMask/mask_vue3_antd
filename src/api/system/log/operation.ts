import { request } from '@/plugins/httpFetch';

/**
 * 操作日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportSysOperationLog(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/logs/operation/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询操作日志列表
 * @param query 查询参数
 * @returns object
 */
export function listSysOperationLog(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/logs/operation/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 清空操作日志
 * @returns object
 */
export function cleanSysOperationLog() {
  return request({
    url: '/api/v1/system/logs/operation/clean',
    method: 'DELETE',
  });
}
