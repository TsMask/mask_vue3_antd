import { request, ResultType } from '@/plugins/Fetch';

/**
 * 定时任务调度列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportJob(query: Record<string, string | number | undefined>) {
  return request<Blob>({
    url: '/monitor/job/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询定时任务调度列表
 * @param query 查询参数
 * @returns object
 */
export function listJob(query: Record<string, string | number | undefined>) {
  return request<ResultType>({
    url: '/monitor/job/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询定时任务调度详细
 * @param jobId 任务ID
 * @returns object
 */
export function getJob(jobId: string | number) {
  return request<ResultType>({
    url: `/monitor/job/${jobId}`,
    method: 'get',
  });
}

/**
 * 新增定时任务调度
 * @param data 任务对象
 * @returns object
 */
export function addJob(data: Record<string, object>) {
  return request<ResultType>({
    url: '/monitor/job',
    method: 'post',
    data: data,
  });
}

/**
 * 修改定时任务调度
 * @param data 任务对象
 * @returns object
 */
export function updateJob(data: Record<string, object>) {
  return request<ResultType>({
    url: '/monitor/job',
    method: 'put',
    data: data,
  });
}

/**
 * 删除定时任务调度
 * @param jobId 任务ID
 * @returns object
 */
export function delJob(jobId: string | number) {
  return request<ResultType>({
    url: `/monitor/job/${jobId}`,
    method: 'delete',
  });
}

/**
 * 任务状态修改
 * @param jobId 任务ID
 * @param status 变更状态值
 * @returns
 */
export function changeJobStatus(
  jobId: string | number,
  status: string | number
) {
  return request<ResultType>({
    url: '/monitor/job/changeStatus',
    method: 'put',
    data: {
      jobId,
      status,
    },
  });
}

/**
 * 定时任务立即执行一次
 * @param jobId 任务ID
 * @returns object
 */
export function runJob(jobId: string) {
  return request<ResultType>({
    url: `/monitor/job/run/${jobId}`,
    method: 'put',
  });
}

/**
 * 重置刷新队列
 * @returns object
 */
export function resetQueueJob() {
  return request<ResultType>({
    url: '/monitor/job/resetQueueJob',
    method: 'put',
  });
}
