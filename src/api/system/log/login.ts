import { request } from '@/plugins/http-fetch';

/**
 * 登录日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportSysLogLogin(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/log/login/export',
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
export function listSysLogLogin(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/log/login/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 清空登录日志
 * @returns object
 */
export function cleanSysLogLogin() {
  return request({
    url: '/api/v1/system/log/login/clean',
    method: 'DELETE',
  });
}
