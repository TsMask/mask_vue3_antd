import { request } from '@/plugins/http-fetch';

/**获取服务信息 */
export function getServer() {
  return request({
    url: '/monitor/server',
    method: 'get',
  });
}
