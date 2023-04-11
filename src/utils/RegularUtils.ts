/**
 * 判断是否为http(s)://开头
 * @param link 网络链接
 * @returns true | false
 */
export function validHttp(link: string): boolean {
  return /^http(s)?:\/\/+/.test(link);
}

/**
 * 判断是否为有效手机号格式
 * @param mobile 手机号字符串
 * @returns true | false
 */
export function validMobile(mobile: string): boolean {
  return /^1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(mobile);
}

/**
 * 判断是否为有效邮箱格式
 * @param email 邮箱字符串
 * @returns true | false
 */
export function validEmail(email: string): boolean {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/.test(
    email
  );
}
