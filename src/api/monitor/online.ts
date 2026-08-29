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
 * @param device_id 设备会话标识
 * @returns object
 */
export function forceLogout(device_id: string) {
  return request({
    url: `/api/v1/monitor/user-online/logout/${device_id}`,
    method: 'DELETE',
  });
}
