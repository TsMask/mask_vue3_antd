import { request, ResultType } from '@/plugins/Fetch';

/**
 * 岗位列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportPost(query: Record<string, any>) {
  return request<Blob>({
    url: '/system/post/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询岗位列表
 * @param query 查询参数
 * @returns object
 */
export function listPost(query: Record<string, any>) {
  return request<ResultType>({
    url: '/system/post/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询岗位详细
 * @param postId 岗位ID
 * @returns object
 */
export function getPost(postId: string | number) {
  return request<ResultType>({
    url: `/system/post/${postId}`,
    method: 'get',
  });
}

/**
 * 新增岗位
 * @param data 岗位对象
 * @returns object
 */
export function addPost(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/post',
    method: 'post',
    data: data,
  });
}

/**
 * 修改岗位
 * @param data 岗位对象
 * @returns object
 */
export function updatePost(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/post',
    method: 'put',
    data: data,
  });
}

/**
 * 删除岗位
 * @param postId 岗位ID
 * @returns object
 */
export function delPost(postId: string | number) {
  return request<ResultType>({
    url: `/system/post/${postId}`,
    method: 'delete',
  });
}
