import { request } from '@/plugins/http-fetch';

/**
 * 查询在线用户列表
 * @param query 查询参数
 * @returns object
 */
export function listOnline(query: Record<string, any>) {
  return request({
    url: '/monitor/user-online/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 强退用户
 * @param tokenId 授权标识
 * @returns object
 */
export function forceLogout(tokenId: string) {
  return request({
    url: `/monitor/user-online/logout/${tokenId}`,
    method: 'DELETE',
  });
}
