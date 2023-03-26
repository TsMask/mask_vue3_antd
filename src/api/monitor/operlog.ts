import { request, ResultType } from '@/plugins/Fetch';

/**
 * 操作日志列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportOperlog(
  query: Record<string, string | number | undefined>
) {
  return request<Blob>({
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
  query: Record<string, string | number | undefined>
) {
  return request<ResultType>({
    url: '/monitor/operlog/list',
    method: 'get',
    params: query,
  });
}

/**
 * 删除操作日志
 * @param operId 操作日志Id
 * @returns object
 */
export function delOperlog(operId: string) {
  return request<ResultType>({
    url: `/monitor/operlog/${operId}`,
    method: 'delete',
  });
}

/**
 * 清空操作日志
 * @returns object
 */
export function cleanOperlog() {
  return request<ResultType>({
    url: '/monitor/operlog/clean',
    method: 'delete',
  });
}
