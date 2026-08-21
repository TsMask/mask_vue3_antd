import { request } from '@/plugins/http-fetch';

/**
 * 查询缓存详细
 * @returns object
 */
export function getCache() {
  return request({
    url: '/monitor/cache',
    method: 'GET',
  });
}

/**
 * 查询缓存名称列表
 * @returns object
 */
export function listCacheName() {
  return request({
    url: '/monitor/cache/names',
    method: 'GET',
  });
}

/**
 * 查询缓存名称下键名列表
 * @param cache_name 缓存名称列表中得到的缓存名称
 * @returns object
 */
export function listCacheKey(cache_name: string) {
  return request({
    url: `/monitor/cache/keys`,
    method: 'GET',
    params: { cache_name },
  });
}

/**
 * 查询缓存内容
 * @param cache_name 键名列表中得到的缓存名称
 * @param cache_key 键名列表中得到的缓存键名
 * @returns object
 */
export function getCacheValue(cache_name: string, cache_key: string) {
  return request({
    url: `/monitor/cache/value`,
    method: 'GET',
    params: { cache_name, cache_key },
  });
}

/**
 * 缓存名称列表安全删除
 *
 * 指定可清理的缓存key
 * @returns object
 */
export function clearCacheSafe() {
  return request({
    url: '/monitor/cache/names',
    method: 'DELETE',
  });
}

/**
 * 删除缓存名称下键名列表
 * @param cache_name 缓存名称列表中得到的缓存名称
 * @returns object
 */
export function clearCacheName(cache_name: string) {
  return request({
    url: `/monitor/cache/keys`,
    method: 'DELETE',
    params: { cache_name },
  });
}

/**
 * 删除缓存键名
 * @param cache_name 键名列表中得到的缓存名称
 * @param cache_key 键名列表中得到的缓存键名
 * @returns object
 */
export function clearCacheKey(cache_name: string, cache_key: string) {
  return request({
    url: `/monitor/cache/value`,
    method: 'DELETE',
    params: { cache_name, cache_key },
  });
}
