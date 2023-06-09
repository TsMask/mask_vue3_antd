import { request } from '@/plugins/http-fetch';

/**
 * 导入用户模板数据
 * @param data 表单数据对象
 * @returns object
 */
export function importData(data: FormData) {
  return request({
    url: '/system/user/importData',
    method: 'post',
    data,
    dataType: 'form-data',
  });
}

/**
 * 导入用户模板下载
 * @returns bolb
 */
export function importTemplate() {
  return request({
    url: '/system/user/importTemplate',
    method: 'get',
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
    method: 'post',
    data: query,
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
    method: 'get',
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
    method: 'get',
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
    method: 'post',
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
    method: 'put',
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
    method: 'delete',
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
    url: '/system/user/resetPwd',
    method: 'put',
    data: {
      userId,
      password,
    },
  });
}

/**
 * 用户状态修改
 * @param userId 用户ID
 * @param status 变更状态值
 * @returns object
 */
export function changeUserStatus(
  userId: string | number,
  status: string | number
) {
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: {
      userId,
      status,
    },
  });
}
