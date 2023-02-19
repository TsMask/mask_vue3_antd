import fatch from '@/plugins/Fatch';

// 获取服务信息
export function getServer() {
  return fatch({
    url: '/monitor/server',
    method: 'get',
  });
}
