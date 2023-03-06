import { request } from '@/plugins/Fetch';

// 获取服务信息
export function getServer() {
  return request({
    url: '/monitor/server',
    method: 'get',
  });
}
