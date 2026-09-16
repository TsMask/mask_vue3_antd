import { request } from '@/api/httpClient';

/**
 * 登录日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportSysLoginLog(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/logs/login/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询登录日志列表
 * @param query 查询参数
 * @returns object
 */
export function listSysLoginLog(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/logs/login/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 清空登录日志
 * @returns object
 */
export function cleanSysLoginLog() {
  return request({
    url: '/api/v1/system/logs/login/clean',
    method: 'DELETE',
  });
}
