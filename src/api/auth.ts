import { request } from '@/plugins/http-fetch';

/**
 * 登录方法
 * @param data 数据
 * @returns 结果
 */
export function login(data: Record<string, string>) {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: data,
    withToken: false,
  });
}

/**
 * 退出方法
 * @returns object
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'POST',
    repeatSubmit: false,
  });
}

/**
 * 注册方法
 * @param data 注册对象
 * @returns object
 */
export function register(data: Record<string, any>) {
  return request({
    url: '/auth/register',
    method: 'POST',
    data: data,
    withToken: false,
  });
}

/**
 * 刷新登录令牌
 * @param data 数据
 * @returns 结果
 */
export function refreshToken(refreshToken: string) {
  return request({
    url: '/auth/refresh-token',
    method: 'POST',
    data: { refresh_token: refreshToken },
    withToken: false,
  });
}

/**
 * 获取用户详细信息
 * @returns object
 */
export function getInfo() {
  return request({
    url: '/me',
    method: 'GET',
  });
}

/**
 * 获取路由
 * @returns object
 */
export const getRouter = () => {
  return request({
    url: '/router',
    method: 'GET',
  });
};

/**
 * 获取验证码
 * @returns object
 */
export function getCaptchaImage() {
  return request({
    url: '/captcha-image',
    method: 'GET',
    withToken: false,
  });
}
