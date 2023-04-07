import { request, ResultType } from '@/plugins/Fetch';

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
