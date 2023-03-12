import { request, ResultType } from '@/plugins/Fetch';

/**获取服务信息 */
export function getServer() {
  return request<ResultType>({
    url: '/monitor/server',
    method: 'get',
  });
}
