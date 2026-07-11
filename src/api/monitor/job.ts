import { request } from '@/plugins/http-fetch';

/**
 * 定时任务调度列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportJob(query: Record<string, any>) {
  return request({
    url: '/monitor/job/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询定时任务调度列表
 * @param query 查询参数
 * @returns object
 */
export function listJob(query: Record<string, any>) {
  return request({
    url: '/monitor/job/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询定时任务调度详细
 * @param jobId 任务ID
 * @returns object
 */
export function getJob(id: string | number) {
  return request({
    url: `/monitor/job/${id}`,
    method: 'GET',
  });
}

/**
 * 新增定时任务调度
 * @param data 任务对象
 * @returns object
 */
export function addJob(data: Record<string, any>) {
  return request({
    url: '/monitor/job',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改定时任务调度
 * @param data 任务对象
 * @returns object
 */
export function updateJob(data: Record<string, any>) {
  return request({
    url: '/monitor/job',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除定时任务调度
 * @param jobId 任务ID
 * @returns object
 */
export function delJob(id: string | number) {
  return request({
    url: `/monitor/job/${id}`,
    method: 'DELETE',
  });
}

/**
 * 任务状态修改
 * @param jobId 任务ID
 * @param jobStatus 变更状态值
 * @returns
 */
export function changeStatus(jobId: string | number, jobStatus: string | number) {
  return request({
    url: '/monitor/job/status',
    method: 'PUT',
    data: {
      jobId,
      jobStatus,
    },
  });
}

/**
 * 定时任务立即执行一次
 * @param jobId 任务ID
 * @returns object
 */
export function runJob(id: string | number) {
  return request({
    url: `/monitor/job/run/${id}`,
    method: 'PUT',
  });
}

/**
 * 重置刷新队列
 * @returns object
 */
export function resetJob() {
  return request({
    url: '/monitor/job/reset',
    method: 'PUT',
  });
}
