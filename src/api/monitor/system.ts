import { request } from '@/plugins/http-fetch';

/**服务器服务信息 */
export function getSystemInfo() {
  return request({
    url: '/monitor/system-info',
    method: 'get',
  });
}
