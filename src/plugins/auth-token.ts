import { TOKEN_KEY } from '@/constants/token-constants';
import Cookies from 'js-cookie';

/**获取cookis中Token字符串 */
export function getToken(): string {
  return Cookies.get(TOKEN_KEY) || '';
}

/**设置cookis中Token字符串 */
export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token);
}

/**移除cookis中Token字符串 */
export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
}
