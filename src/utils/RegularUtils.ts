/**
 * 有效密码格式
 * 密码至少包含大小写字母、数字、特殊符号，且不少于6位
 */
export const regExpPasswd =
  /^(?![A-Za-z0-9]+$)(?![a-z0-9\W]+$)(?![A-Za-z\W]+$)(?![A-Z0-9\W]+$)[a-zA-Z0-9\W]{6,18}$/;

/**
 * 有效手机号格式
 */
export const regExpMobile = /^1[3|4|5|6|7|8|9][0-9]\d{8}$/;

/**
 * 有效邮箱格式
 */
export const regExpEmail =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/;

/**
 * 是否为http(s)://开头
 */
export const regExpHttp = /^http(s)?:\/\/+/;

/**
 * 判断是否为http(s)://开头
 * @param link 网络链接
 * @returns true | false
 */
export function validHttp(link: string): boolean {
  return regExpHttp.test(link);
}

/**
 * 判断是否为有效手机号格式
 * @param mobile 手机号字符串
 * @returns true | false
 */
export function validMobile(mobile: string): boolean {
  return regExpMobile.test(mobile);
}

/**
 * 判断是否为有效邮箱格式
 * @param email 邮箱字符串
 * @returns true | false
 */
export function validEmail(email: string): boolean {
  return regExpEmail.test(email);
}
