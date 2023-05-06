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
 * 查询缓存键名列表
 * @param cacheName 缓存键名
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
 * @param cacheName 缓存键名
 * @param cacheKey 缓存键
 * @returns object
 */
export function getCacheValue(cacheName: string, cacheKey: string) {
  return request<ResultType>({
    url: `/monitor/cache/getValue/${cacheName}/${cacheKey}`,
    method: 'get',
  });
}

/**
 * 清理指定名称缓存
 * @param cacheName 缓存键名
 * @returns object
 */
export function clearCacheName(cacheName: string) {
  return request<ResultType>({
    url: `/monitor/cache/clearCacheName/${cacheName}`,
    method: 'delete',
  });
}

/**
 * 清理指定键名缓存
 * @param cacheKey 缓存键
 * @returns object
 */
export function clearCacheKey(cacheKey: string) {
  return request<ResultType>({
    url: `/monitor/cache/clearCacheKey/${cacheKey}`,
    method: 'delete',
  });
}

/**
 * 安全清理缓存
 * @returns object
 */
export function clearCacheSafe() {
  return request<ResultType>({
    url: '/monitor/cache/clearCacheSafe',
    method: 'delete',
  });
}
