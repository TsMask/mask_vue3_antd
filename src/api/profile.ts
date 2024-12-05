import { request } from '@/plugins/http-fetch';

/**
 * 查询用户个人信息
 * @returns object
 */
export function getUserProfile() {
  return request({
    url: '/system/user/profile',
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
    url: '/system/user/profile',
    method: 'PUT',
    data: data,
  });
}

/**
 * 用户个人密码重置
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns object
 */
export function updateUserPassword(oldPassword: string, newPassword: string) {
  return request({
    url: '/system/user/profile/password',
    method: 'PUT',
    data: { oldPassword, newPassword },
  });
}
