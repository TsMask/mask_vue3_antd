import { request, ResultType } from '@/plugins/http-fetch';

/**
 * 查询缓存详细
 * @returns object
 */
export function getCache() {
  return request<ResultType>({
    url: '/monitor/cache',
    method: 'get',
  });
}

/**
 * 查询缓存名称列表
 * @returns object
 */
export function listCacheName() {
  return request<ResultType>({
    url: '/monitor/cache/getNames',
    method: 'get',
  });
}

/**
 * 查询缓存名称下键名列表
 * @param cacheName 缓存名称列表中得到的缓存名称
 * @returns object
 */
export function listCacheKey(cacheName: string) {
  return request<ResultType>({
    url: `/monitor/cache/getKeys/${cacheName}`,
    method: 'get',
  });
}

/**
 * 查询缓存内容
 * @param cacheName 键名列表中得到的缓存名称
 * @param cacheKey 键名列表中得到的缓存键名
 * @returns object
 */
export function getCacheValue(cacheName: string, cacheKey: string) {
  return request<ResultType>({
    url: `/monitor/cache/getValue/${cacheName}/${cacheKey}`,
    method: 'get',
  });
}

/**
 * 删除缓存名称下键名列表
 * @param cacheName 缓存名称列表中得到的缓存名称
 * @returns object
 */
export function clearCacheName(cacheName: string) {
  return request<ResultType>({
    url: `/monitor/cache/clearCacheName/${cacheName}`,
    method: 'delete',
  });
}

/**
 * 删除缓存键名
 * @param cacheName 键名列表中得到的缓存名称
 * @param cacheKey 键名列表中得到的缓存键名
 * @returns object
 */
export function clearCacheKey(cacheName: string, cacheKey: string) {
  return request<ResultType>({
    url: `/monitor/cache/clearCacheKey/${cacheName}/${cacheKey}`,
    method: 'delete',
  });
}

/**
 * 安全清理缓存名称
 *
 * 指定可清理的缓存key
 * @returns object
 */
export function clearCacheSafe() {
  return request<ResultType>({
    url: '/monitor/cache/clearCacheSafe',
    method: 'delete',
  });
}
