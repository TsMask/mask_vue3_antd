import { request } from '@/plugins/httpFetch';

/**
 * 查询用户个人信息
 * @returns object
 */
export function getUserProfile() {
  return request({
    url: '/api/v1/system/users/profile',
    method: 'GET',
  });
}

/**
 * 修改用户个人信息
 * @param data 用户对象
 * @returns object
 */
export function updateUserProfile(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/users/profile',
    method: 'PUT',
    data: data,
  });
}

/**
 * 用户个人密码重置
 * @param old_password 旧密码
 * @param new_password 新密码
 * @returns object
 */
export function updateUserPassword(old_password: string, new_password: string) {
  return request({
    url: '/api/v1/system/users/profile/password',
    method: 'PUT',
    data: { old_password, new_password },
  });
}
