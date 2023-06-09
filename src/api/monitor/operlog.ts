import { request } from '@/plugins/http-fetch';

/**
 * 操作日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportOperlog(
  query: Record<string, any>
) {
  return request({
    url: '/monitor/operlog/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询操作日志列表
 * @param query 查询参数
 * @returns object
 */
export function listOperlog(
  query: Record<string, any>
) {
  return request({
    url: '/monitor/operlog/list',
    method: 'get',
    params: query,
  });
}

/**
 * 删除操作日志
 * @param operId 操作日志ID
 * @returns object
 */
export function delOperlog(operId: string) {
  return request({
    url: `/monitor/operlog/${operId}`,
    method: 'delete',
  });
}

/**
 * 清空操作日志
 * @returns object
 */
export function cleanOperlog() {
  return request({
    url: '/monitor/operlog/clean',
    method: 'delete',
  });
}
