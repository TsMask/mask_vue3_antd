import { request } from '@/plugins/http-fetch';

// 登录方法
export function login(data: Record<string, string>) {
  return request({
    url: '/login',
    method: 'POST',
    data: data,
    whithToken: false,
  });
}

/**
 * 注册方法
 * @param data 注册对象
 * @returns object
 */
export function register(data: Record<string, any>) {
  return request({
    url: '/register',
    method: 'POST',
    data: data,
    whithToken: false,
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
 * 退出方法
 * @returns object
 */
export function logout() {
  return request({
    url: '/logout',
    method: 'POST',
    repeatSubmit: false,
  });
}

/**
 * 获取验证码
 * @returns object
 */
export function getCaptchaImage() {
  return request({
    url: '/captcha-image',
    method: 'GET',
    whithToken: false,
  });
}
