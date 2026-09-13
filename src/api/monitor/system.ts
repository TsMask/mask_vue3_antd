import { request } from '@/plugins/httpFetch';

/**服务器服务信息 */
export function getSystemInfo() {
  return request({
    url: '/api/v1/monitor/system',
    method: 'GET',
  });
}
