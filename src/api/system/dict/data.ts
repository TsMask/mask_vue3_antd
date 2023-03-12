import { request, ResultType } from '@/plugins/Fetch';

/**
 * 查询字典数据列表
 * @param query 查询值
 * @returns
 */
export function listData(query: Record<string, string | undefined>) {
  return request<ResultType>({
    url: '/system/dict/data/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询字典数据详细
 * @param dictCode 字典代码值
 * @returns object
 */
export function getData(dictCode: string | number) {
  return request<ResultType>({
    url: `/system/dict/data/${dictCode}`,
    method: 'get',
  });
}

/**
 * 根据字典类型查询字典数据信息
 * @param dictType 字典类型
 * @returns object
 */
export function getDicts(dictType: string) {
  return request<ResultType>({
    url: `/system/dict/data/type/${dictType}`,
    method: 'get',
  });
}

/**
 * 新增字典数据
 * @param data 字典数据对象
 * @returns object
 */
export function addData(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/dict/data',
    method: 'post',
    data: data,
  });
}

/**
 * 修改字典数据
 * @param data 字典数据对象
 * @returns object
 */
export function updateData(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/dict/data',
    method: 'put',
    data: data,
  });
}

/**
 * 删除字典数据
 * @param dictCode 字典代码值
 * @returns object
 */
export function delData(dictCode: string | number) {
  return request<ResultType>({
    url: `/system/dict/data/${dictCode}`,
    method: 'delete',
  });
}
