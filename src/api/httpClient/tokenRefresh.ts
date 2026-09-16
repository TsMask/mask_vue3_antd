import {
  delAccessToken,
  delRefreshToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/utils/tokenStorage';
import {
  RESULT_CODE_ERROR,
  RESULT_CODE_EXCEPTION,
  RESULT_MSG_SERVER_ERROR,
} from '@/constants/result';
import { isSuccess } from './result';
import type { ResultType, TokenRefreshFunction } from './types';

export const TOKEN_EXPIRED_CODE = 401001;

let refreshAccessToken: TokenRefreshFunction | null = null;
let refreshingTokenPromise: Promise<ResultType> | null = null;

/** The router injects the refresh API to avoid an HTTP -> API module cycle. */
export function setupHttpTokenRefresh(refresh: TokenRefreshFunction) {
  refreshAccessToken = refresh;
}

export function authError(msg?: string): ResultType {
  return {
    code: RESULT_CODE_ERROR,
    msg: msg || '登录已过期，请重新登录',
  };
}

export function hasTokenPair(result: ResultType): boolean {
  return Boolean(
    result.data?.access_token &&
      result.data?.expires_in &&
      result.data?.refresh_token &&
      result.data?.refresh_expires_in
  );
}

/** Concurrent requests share one refresh call and one refresh-token rotation. */
export async function ensureAccessToken(): Promise<ResultType> {
  if (refreshingTokenPromise) return refreshingTokenPromise;

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return authError();
  if (!refreshAccessToken) return authError('Token refresh is not ready');

  refreshingTokenPromise = refreshAccessToken(currentRefreshToken)
    .catch(
      (error: any): ResultType => ({
        code: RESULT_CODE_EXCEPTION,
        msg: error?.message || RESULT_MSG_SERVER_ERROR,
      })
    )
    .then((result): ResultType => {
      if (isSuccess(result) && hasTokenPair(result)) {
        setAccessToken(result.data.access_token, result.data.expires_in);
        setRefreshToken(
          result.data.refresh_token,
          result.data.refresh_expires_in
        );
        return result;
      }

      if (result.code === TOKEN_EXPIRED_CODE) {
        delAccessToken();
        delRefreshToken();
      }
      return result;
    })
    .finally(() => {
      refreshingTokenPromise = null;
    });

  return refreshingTokenPromise;
}
