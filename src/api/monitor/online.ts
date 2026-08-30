import { request } from '@/plugins/http-fetch';

/**
 * 查询在线用户列表
 * @param query 查询参数
 * @returns object
 */
export function listOnline(query: Record<string, any>) {
  return request({
    url: '/api/v1/monitor/user-online/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 强退用户
 * @param session_id 会话唯一标识
 * @returns object
 */
export function forceLogout(session_id: string) {
  return request({
    url: `/api/v1/monitor/user-online/logout/${session_id}`,
    method: 'DELETE',
  });
}
