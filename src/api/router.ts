import { request } from '@/plugins/http-fetch';

/**
 * 获取路由
 * @returns object
 */
export const getRouters = () => {
  return request({
    url: '/getRouters',
    method: 'get',
  });
};
