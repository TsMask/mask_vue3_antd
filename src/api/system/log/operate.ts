import { request } from '@/plugins/http-fetch';

/**
 * 操作日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportSysLogOperate(
  query: Record<string, any>
) {
  return request({
    url: '/system/log/operate/export',
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
export function listSysLogOperate(
  query: Record<string, any>
) {
  return request({
    url: '/system/log/operate/list',
    method: 'get',
    params: query,
  });
}

/**
 * 删除操作日志
 * @param operId 操作日志ID
 * @returns object
 */
export function delSysLogOperate(operId: string) {
  return request({
    url: `/system/log/operate/${operId}`,
    method: 'delete',
  });
}

/**
 * 清空操作日志
 * @returns object
 */
export function cleanSysLogOperate() {
  return request({
    url: '/system/log/operate/clean',
    method: 'delete',
  });
}
