import Cookies from 'js-cookie';
import { TOKEN_COOKIE } from '@/constants/token-constants';

/**获取cookis中Token字符串 */
export function getToken(): string {
  return Cookies.get(TOKEN_COOKIE) || '';
}

/**设置cookis中Token字符串 */
export function setToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token);
}

/**移除cookis中Token字符串 */
export function removeToken(): void {
  Cookies.remove(TOKEN_COOKIE);
}
