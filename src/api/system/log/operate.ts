import { request } from '@/plugins/http-fetch';

/**
 * 操作日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportSysLogOperate(query: Record<string, any>) {
  return request({
    url: '/system/log/operate/export',
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
export function listSysLogOperate(query: Record<string, any>) {
  return request({
    url: '/system/log/operate/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 清空操作日志
 * @returns object
 */
export function cleanSysLogOperate() {
  return request({
    url: '/system/log/operate/clean',
    method: 'DELETE',
  });
}
