import { request, ResultType } from '@/plugins/Fetch';

/**
 * 参数配置列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportConfig(
  query: Record<string, any>
) {
  return request<Blob>({
    url: '/system/config/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询参数配置列表
 * @param query 查询参数
 * @returns object
 */
export function listConfig(query: Record<string, any>) {
  return request<ResultType>({
    url: '/system/config/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询参数详细
 * @param configId 参数配置ID
 * @returns object
 */
export function getConfig(configId: string | number) {
  return request<ResultType>({
    url: `/system/config/${configId}`,
    method: 'get',
  });
}

/**
 * 根据参数键名查询参数值
 * @param configKey 参数键名
 * @returns object
 */
export function getConfigKey(configKey: string) {
  return request<ResultType>({
    url: `/system/config/configKey/${configKey}`,
    method: 'get',
  });
}

/**
 * 新增参数配置
 * @param data 参数配置对象
 * @returns object
 */
export function addConfig(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/config',
    method: 'post',
    data: data,
  });
}

/**
 * 修改参数配置
 * @param data 参数配置对象
 * @returns object
 */
export function updateConfig(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/config',
    method: 'put',
    data: data,
  });
}

/**
 * 删除参数配置
 * @param configId 参数配置ID
 * @returns object
 */
export function delConfig(configId: string | number) {
  return request<ResultType>({
    url: `/system/config/${configId}`,
    method: 'delete',
  });
}

/**
 * 刷新参数缓存
 * @returns object
 */
export function refreshCache() {
  return request<ResultType>({
    url: '/system/config/refreshCache',
    method: 'put',
  });
}
