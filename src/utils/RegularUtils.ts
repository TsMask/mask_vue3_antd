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
  return /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(
    mobile
  );
}

/**
 * 判断是否为有效邮箱格式
 * @param email 邮箱字符串
 * @returns true | false
 */
export function validEmail(email: string): boolean {
  return /^[a-z0-9A-Z]+[-|a-z0-9A-Z._]+@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\\.)+[a-z]{2,}$/.test(
    email
  );
}
