import { request, ResultType } from '@/plugins/Fetch';

// 登录方法
export function login(data: Record<string, object>) {
  return request<ResultType>({
    url: '/login',
    method: 'post',
    data: data,
    whithToken: false,
  });
}

// 注册方法
export function register(data: Record<string, object>) {
  return request({
    url: '/register',
    method: 'post',
    data: data,
    whithToken: false,
  });
}

// 获取用户详细信息
export function getInfo() {
  return request<ResultType>({
    url: '/getInfo',
    method: 'get',
  });
}

// 退出方法
export function logout() {
  return request<ResultType>({
    url: '/logout',
    method: 'post',
  });
}

// 获取验证码
export function getCaptchaImage() {
  return request<ResultType>({
    url: '/captchaImage',
    method: 'get',
    whithToken: false,
  });
}
