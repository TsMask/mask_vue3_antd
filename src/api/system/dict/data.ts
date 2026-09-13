import { request } from '@/plugins/httpFetch';

/**
 * 字典数据列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportData(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/datas/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询字典数据列表
 * @param query 查询值
 * @returns
 */
export function listData(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/datas/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询字典数据详细
 * @param dataId 字典代码值
 * @returns object
 */
export function getData(dataId: string | number) {
  return request({
    url: `/api/v1/system/dict/datas/${dataId}`,
    method: 'GET',
  });
}

/**
 * 新增字典数据
 * @param data 字典数据对象
 * @returns object
 */
export function addData(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/datas',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改字典数据
 * @param data 字典数据对象
 * @returns object
 */
export function updateData(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/dict/datas',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除字典数据
 * @param dataId 字典代码值
 * @returns object
 */
export function delData(dataId: string | number) {
  return request({
    url: `/api/v1/system/dict/datas/${dataId}`,
    method: 'DELETE',
  });
}

/**
 * 字典数据列表（指定字典类型）
 * @param dict_type 字典类型
 * @returns object
 */
export function getDictDataType(dict_type: string) {
  return request({
    url: `/api/v1/system/dict/datas/type/${dict_type}`,
    method: 'GET',
  });
}
