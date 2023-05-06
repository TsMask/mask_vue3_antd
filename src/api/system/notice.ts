import { request, ResultType } from '@/plugins/http-fetch';

/**
 * 查询公告列表
 * @param query 查询参数
 * @returns object
 */
export function listNotice(query: Record<string, any>) {
  return request<ResultType>({
    url: '/system/notice/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询公告详细
 * @param menuId 公告ID
 * @returns object
 */
export function getNotice(noticeId: string | number) {
  return request<ResultType>({
    url: `/system/notice/${noticeId}`,
    method: 'get',
  });
}

/**
 * 新增公告
 * @param data 公告对象
 * @returns object
 */
export function addNotice(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/notice',
    method: 'post',
    data: data,
  });
}

/**
 * 修改公告
 * @param data 公告对象
 * @returns object
 */
export function updateNotice(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/notice',
    method: 'put',
    data: data,
  });
}

/**
 * 删除公告
 * @param noticeId 公告ID
 * @returns object
 */
export function delNotice(noticeId: string | number) {
  return request<ResultType>({
    url: `/system/notice/${noticeId}`,
    method: 'delete',
  });
}
