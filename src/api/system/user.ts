import { request, ResultType } from '@/plugins/http-fetch';

/**
 * 用户列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportUser(query: Record<string, any>) {
  return request<Blob>({
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
  return request<ResultType>({
    url: '/system/user/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询用户详细
 * @param userId 用户ID
 * @returns object
 */
export function getUser(userId?: string | number) {
  let url = '/system/user';
  if (userId && userId !== 'undefined' && userId !== 'null') {
    url = `/system/user/${userId}`;
  }
  return request<ResultType>({
    url: url,
    method: 'get',
  });
}

/**
 * 新增用户
 * @param data 用户对象
 * @returns object
 */
export function addUser(data: Record<string, any>) {
  return request<ResultType>({
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
  return request<ResultType>({
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
  return request<ResultType>({
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
  return request<ResultType>({
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
  return request<ResultType>({
    url: '/system/user/changeStatus',
    method: 'put',
    data: {
      userId,
      status,
    },
  });
}

/**
 * 查询用户个人信息
 * @returns object
 */
export function getUserProfile() {
  return request<ResultType>({
    url: '/system/user/profile',
    method: 'get',
  });
}

/**
 * 修改用户个人信息
 * @param data 用户对象
 * @returns object
 */
export function updateUserProfile(data: Record<string, any>) {
  return request<ResultType>({
    url: '/system/user/profile',
    method: 'put',
    data: data,
  });
}

/**
 * 用户密码重置
 * @param userId 用户ID
 * @param status 变更状态值
 * @returns object
 */
export function updateUserPwd(oldPassword: string, newPassword: string) {
  return request<ResultType>({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: {
      oldPassword,
      newPassword,
    },
  });
}

/**
 * 用户头像上传
 * @param data 表单数据对象
 * @returns object
 */
export function uploadAvatar(data: FormData) {
  return request<ResultType>({
    url: '/system/user/profile/avatar',
    method: 'post',
    data,
    dataType: 'form-data',
  });
}
