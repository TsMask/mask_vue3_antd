import { request, ResultType } from '@/plugins/http-fetch';

/**
 * 获取路由
 * @returns object
 */
export const getRouters = () => {
  return request<ResultType>({
    url: '/getRouters',
    method: 'get',
  });
};
