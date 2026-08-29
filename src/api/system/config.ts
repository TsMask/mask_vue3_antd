import { request } from '@/plugins/http-fetch';

/**
 * 参数配置列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportConfig(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/config/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询参数配置列表
 * @param query 查询参数
 * @returns object
 */
export function listConfig(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/config/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询参数详细
 * @param configId 参数配置ID
 * @returns object
 */
export function getConfig(configId: string | number) {
  return request({
    url: `/api/v1/system/config/${configId}`,
    method: 'GET',
  });
}

/**
 * 根据参数键名查询参数值
 * @param config_key 参数键名
 * @returns object
 */
export function getConfigKey(config_key: string) {
  return request({
    url: `/api/v1/system/config/config-key/${config_key}`,
    method: 'GET',
  });
}

/**
 * 新增参数配置
 * @param data 参数配置对象
 * @returns object
 */
export function addConfig(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/config',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改参数配置
 * @param data 参数配置对象
 * @returns object
 */
export function updateConfig(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/config',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除参数配置
 * @param configId 参数配置ID
 * @returns object
 */
export function delConfig(configId: string | number) {
  return request({
    url: `/api/v1/system/config/${configId}`,
    method: 'DELETE',
  });
}

/**
 * 刷新参数缓存
 * @returns object
 */
export function refreshConfig() {
  return request({
    url: '/api/v1/system/config/refresh',
    method: 'PUT',
  });
}
