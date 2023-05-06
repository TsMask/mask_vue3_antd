import { request, ResultType } from '@/plugins/http-fetch';

/**
 * 登录日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportLogininfor(
  query: Record<string, any>
) {
  return request<Blob>({
    url: '/monitor/logininfor/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询登录日志列表
 * @param query 查询参数
 * @returns object
 */
export function listLogininfor(
  query: Record<string, any>
) {
  return request<ResultType>({
    url: '/monitor/logininfor/list',
    method: 'get',
    params: query,
  });
}

/**
 * 删除登录日志
 * @param infoId 登录日志Id
 * @returns object
 */
export function delLogininfor(infoId: string) {
  return request<ResultType>({
    url: `/monitor/logininfor/${infoId}`,
    method: 'delete',
  });
}

/**
 * 清空登录日志
 * @returns object
 */
export function cleanLogininfor() {
  return request<ResultType>({
    url: '/monitor/logininfor/clean',
    method: 'delete',
  });
}

/**
 * 解锁用户登录状态
 * @param userName 登录用户名-账号
 * @returns object
 */
export function unlockLogininfor(userName: string) {
  return request<ResultType>({
    url: `/monitor/logininfor/unlock/${userName}`,
    method: 'put',
  });
}
