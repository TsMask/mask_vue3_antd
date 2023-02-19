import request from '@/plugins/Fatch';

// 获取路由
export const getRouters = () => {
  return request({
    url: '/getRouters',
    method: 'get',
  });
};
