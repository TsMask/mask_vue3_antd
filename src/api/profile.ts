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
 * 用户密码重置
 * @param userId 用户ID
 * @param status 变更状态值
 * @returns object
 */
export function updateUserPasswd(oldPassword: string, newPassword: string) {
  return request({
    url: '/system/user/profile/passwd',
    method: 'PUT',
    data: {
      oldPassword,
      newPassword,
    },
  });
}
