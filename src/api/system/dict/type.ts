import { request } from '@/plugins/http-fetch';

/**
 * 字典类型列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportType(query: Record<string, any>) {
  return request({
    url: '/system/dict/type/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询字典类型列表
 * @param query 查询值
 * @returns
 */
export function listType(query: Record<string, any>) {
  return request({
    url: '/system/dict/type/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询字典类型详细
 * @param dictId 字典编号
 * @returns object
 */
export function getType(dictId: string | number) {
  return request({
    url: `/system/dict/type/${dictId}`,
    method: 'get',
  });
}

/**
 * 新增字典类型
 * @param data 字典数据对象
 * @returns object
 */
export function addType(data: Record<string, any>) {
  return request({
    url: '/system/dict/type',
    method: 'post',
    data: data,
  });
}

/**
 * 修改字典类型
 * @param data 字典数据对象
 * @returns object
 */
export function updateType(data: Record<string, any>) {
  return request({
    url: '/system/dict/type',
    method: 'put',
    data: data,
  });
}

/**
 * 删除字典类型
 * @param dictCode 字典代码值
 * @returns object
 */
export function delType(dictId: string | number) {
  return request({
    url: `/system/dict/type/${dictId}`,
    method: 'delete',
  });
}

/**
 * 刷新字典缓存
 * @param data 字典数据对象
 * @returns object
 */
export function refreshCache() {
  return request({
    url: '/system/dict/type/refreshCache',
    method: 'put',
  });
}

/**
 * 获取字典选择框列表
 * @param data 字典数据对象
 * @returns object
 */
export function getDictOptionselect() {
  return request({
    url: '/system/dict/type/getDictOptionselect',
    method: 'get',
  });
}
