import { request } from '@/api/httpClient';

/**
 * 字典类型列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportDictType(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/types/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询字典类型列表
 * @param query 查询值
 * @returns
 */
export function listDictType(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/types/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询字典类型详细
 * @param dict_id 字典编号
 * @returns object
 */
export function getDictType(dict_id: string | number) {
  return request({
    url: `/api/v1/system/dict/types/${dict_id}`,
    method: 'GET',
  });
}

/**
 * 新增字典类型
 * @param data 字典数据对象
 * @returns object
 */
export function addDictType(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/types',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改字典类型
 * @param data 字典数据对象
 * @returns object
 */
export function updateDictType(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/types',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除字典类型
 * @param dataId 字典代码值
 * @returns object
 */
export function delDictType(dict_id: string | number) {
  return request({
    url: `/api/v1/system/dict/types/${dict_id}`,
    method: 'DELETE',
  });
}

/**
 * 刷新字典缓存
 * @param data 字典数据对象
 * @returns object
 */
export function refreshCache() {
  return request({
    url: '/api/v1/system/dict/types/refresh',
    method: 'PUT',
  });
}

/**
 * 获取字典选择框列表
 * @param data 字典数据对象
 * @returns object
 */
export function getDictOption() {
  return request({
    url: '/api/v1/system/dict/types/options',
    method: 'GET',
  });
}
