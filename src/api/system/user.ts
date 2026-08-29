import { request } from '@/plugins/http-fetch';

/**
 * 导入用户模板数据
 * @param data 表单数据对象
 * @returns object
 */
export function importData(filePath: string, update: boolean) {
  return request({
    url: '/api/v1/system/user/import',
    method: 'POST',
    data: { filePath, update },
    timeout: 60_000,
  });
}

/**
 * 导入用户模板下载
 * @returns bolb
 */
export function importTemplate() {
  return request({
    url: '/api/v1/system/user/import/template',
    method: 'GET',
    responseType: 'blob',
  });
}

/**
 * 用户列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportUser(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/user/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
    timeout: 60_000,
  });
}

/**
 * 查询用户列表
 * @param query 查询参数
 * @returns object
 */
export function listUser(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/user/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询用户详细
 * @param user_id 用户ID，新增0
 * @returns object
 */
export function getUser(user_id: string | number = '0') {
  return request({
    url: `/api/v1/system/user/${user_id}`,
    method: 'GET',
  });
}

/**
 * 新增用户
 * @param data 用户对象
 * @returns object
 */
export function addUser(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/user',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改用户
 * @param data 用户对象
 * @returns object
 */
export function updateUser(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/user',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除用户
 * @param user_id 用户ID
 * @returns object
 */
export function delUser(user_id: string | number) {
  return request({
    url: `/api/v1/system/user/${user_id}`,
    method: 'DELETE',
  });
}

/**
 * 用户密码重置
 * @param user_id 用户ID
 * @param password 密码
 * @returns object
 */
export function resetPassword(user_id: string | number, password: string) {
  return request({
    url: '/api/v1/system/user/password',
    method: 'PUT',
    data: {
      user_id,
      password,
    },
  });
}

/**
 * 用户状态修改
 * @param user_id 用户ID
 * @param user_status 变更状态值
 * @returns object
 */
export function changeStatus(
  user_id: string | number,
  user_status: string | number
) {
  return request({
    url: '/api/v1/system/user/status',
    method: 'PUT',
    data: { user_id, user_status },
  });
}

/**
 * 解锁用户登录状态
 * @param user_name 登录账号
 * @returns object
 */
export function unlock(user_name: string) {
  return request({
    url: `/api/v1/system/user/unlock/${user_name}`,
    method: 'PUT',
  });
}
