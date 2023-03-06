import { request, ResultType } from '@/plugins/Fetch';

// 获取路由
export const getRouters = () => {
  return request<ResultType>({
    url: '/getRouters',
    method: 'get',
  });
};
