import { request, ResultType } from '@/plugins/http-fetch';

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
