import { request } from '@/plugins/http-fetch';

/**
 * 导入用户模板数据
 * @param data 表单数据对象
 * @returns object
 */
export function importData(filePath: string, update: boolean) {
  return request({
    url: '/system/user/import',
    method: 'POST',
    data: { filePath, update },
  });
}

/**
 * 导入用户模板下载
 * @returns bolb
 */
export function importTemplate() {
  return request({
    url: '/system/user/import/template',
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
    url: '/system/user/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  });
}

/**
 * 查询用户列表
 * @param query 查询参数
 * @returns object
 */
export function listUser(query: Record<string, any>) {
  return request({
    url: '/system/user/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询用户详细
 * @param userId 用户ID，新增0
 * @returns object
 */
export function getUser(userId: string | number = '0') {
  return request({
    url: `/system/user/${userId}`,
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
    url: '/system/user',
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
    url: '/system/user',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除用户
 * @param userId 用户ID
 * @returns object
 */
export function delUser(userId: string | number) {
  return request({
    url: `/system/user/${userId}`,
    method: 'DELETE',
  });
}

/**
 * 用户密码重置
 * @param userId 用户ID
 * @param password 密码
 * @returns object
 */
export function resetUserPwd(userId: string | number, password: string) {
  return request({
    url: '/system/user/password',
    method: 'PUT',
    data: {
      userId,
      password,
    },
  });
}

/**
 * 用户状态修改
 * @param userId 用户ID
 * @param statusFlag 变更状态值
 * @returns object
 */
export function changeUserStatus(
  userId: string | number,
  statusFlag: string | number
) {
  return request({
    url: '/system/user/status',
    method: 'PUT',
    data: { userId, statusFlag },
  });
}
