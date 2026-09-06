import { request } from '@/plugins/http-fetch';

/**
 * 登录方法
 * @param data 数据
 * @returns 结果
 */
export function login(data: Record<string, string>) {
  return request({
    url: '/api/v1/auth/login',
    method: 'POST',
    data: data,
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 手机号登录方法
 * @param data 数据
 * @returns 结果
 */
export function loginByPhone(data: Record<string, string>) {
  return request({
    url: '/api/v1/auth/login-phone',
    method: 'POST',
    data: data,
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 退出方法
 * @returns object
 */
export function logout() {
  return request({
    url: '/api/v1/auth/logout',
    method: 'POST',
    repeatSubmit: false,
    timeout: 60_000,
  });
}

/**
 * 注册方法
 * @param data 注册对象
 * @returns object
 */
export function register(data: Record<string, any>) {
  return request({
    url: '/api/v1/auth/register',
    method: 'POST',
    data: data,
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 手机号注册方法
 * @param data 数据
 * @returns 结果
 */
export function registerByPhone(data: Record<string, any>) {
  return request({
    url: '/api/v1/auth/register-phone',
    method: 'POST',
    data: data,
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 刷新登录令牌
 * @param data 数据
 * @returns 结果
 */
export function refreshToken(refreshToken: string) {
  return request({
    url: '/api/v1/auth/refresh-token',
    method: 'POST',
    data: { refresh_token: refreshToken },
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 获取用户详细信息
 * @returns object
 */
export function getInfo() {
  return request({
    url: '/api/v1/auth/me',
    method: 'GET',
    timeout: 60_000,
  });
}

/**
 * 获取路由
 * @returns object
 */
export const getRouter = () => {
  return request({
    url: '/api/v1/auth/router',
    method: 'GET',
    timeout: 60_000,
  });
};

/**
 * 获取验证码
 * @returns object
 */
export function getCaptchaImage() {
  return request({
    url: '/api/v1/auth/captcha-image',
    method: 'GET',
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 发送短信登录验证码
 * @param phone 手机号码
 * @returns 结果
 */
export function getCaptchaSMS(phone: string) {
  return request({
    url: '/api/v1/auth/captcha-sms',
    method: 'POST',
    data: { phone },
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 查找密码找回联系方式
 * @param username 用户账号
 * @returns 结果
 */
export function lookupPasswordReset(username: string) {
  return request({
    url: '/api/v1/auth/password-reset/lookup',
    method: 'POST',
    data: { username },
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 发送密码找回验证码
 * @param username 用户账号
 * @returns 结果
 */
export function getPasswordResetCaptcha(username: string) {
  return request({
    url: '/api/v1/auth/password-reset/captcha-email',
    method: 'POST',
    data: { username },
    withToken: false,
    timeout: 60_000,
  });
}

/**
 * 重置登录密码
 * @param data 重置密码对象
 * @returns 结果
 */
export function resetPasswordByEmailOrPhone(data: {
  username: string;
  code: string;
  uuid: string;
  password: string;
  confirm_password: string;
}) {
  return request({
    url: '/api/v1/auth/password-reset',
    method: 'POST',
    data,
    withToken: false,
    timeout: 60_000,
  });
}
