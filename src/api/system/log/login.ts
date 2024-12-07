import { request } from '@/plugins/http-fetch';

/**
 * 登录日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportSysLogLogin(
  query: Record<string, any>
) {
  return request({
    url: '/system/log/login/export',
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
export function listSysLogLogin(
  query: Record<string, any>
) {
  return request({
    url: '/system/log/login/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 删除登录日志
 * @param loginIds 登录Id
 * @returns object
 */
export function delSysLogLogin(loginIds: string) {
  return request({
    url: `/system/log/login/${loginIds}`,
    method: 'DELETE',
  });
}

/**
 * 清空登录日志
 * @returns object
 */
export function cleanSysLogLogin() {
  return request({
    url: '/system/log/login/clean',
    method: 'DELETE',
  });
}

/**
 * 解锁用户登录状态
 * @param userName 登录账号
 * @returns object
 */
export function unlock(userName: string) {
  return request({
    url: `/system/log/login/unlock/${userName}`,
    method: 'PUT',
  });
}
