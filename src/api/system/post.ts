import { request } from '@/plugins/http-fetch';

/**
 * 岗位列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportPost(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/post/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询岗位列表
 * @param query 查询参数
 * @returns object
 */
export function listPost(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/post/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询岗位详细
 * @param post_id 岗位ID
 * @returns object
 */
export function getPost(post_id: string | number) {
  return request({
    url: `/api/v1/system/post/${post_id}`,
    method: 'GET',
  });
}

/**
 * 新增岗位
 * @param data 岗位对象
 * @returns object
 */
export function addPost(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/post',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改岗位
 * @param data 岗位对象
 * @returns object
 */
export function updatePost(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/post',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除岗位
 * @param post_id 岗位ID
 * @returns object
 */
export function delPost(post_id: string | number) {
  return request({
    url: `/api/v1/system/post/${post_id}`,
    method: 'DELETE',
  });
}
