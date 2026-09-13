import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} from '@/plugins/authToken';
import { sessionGetJSON, sessionSetJSON } from '@/utils/cacheSession';
import { TOKEN_KEY, TOKEN_KEY_PREFIX } from '@/constants/token';
import { CACHE_SESSION_FETCH } from '@/constants/cacheKeys';
import {
  APP_REQUEST_HEADER_CODE,
  APP_REQUEST_HEADER_VERSION,
} from '@/constants/app';
import {
  RESULT_CODE_ERROR,
  RESULT_CODE_EXCEPTION,
  RESULT_CODE_SUCCESS,
  RESULT_MSG_NOT_TYPE,
  RESULT_MSG_RESUBMIT,
  RESULT_MSG_SERVER_ERROR,
  RESULT_MSG_SUCCESS,
  RESULT_MSG_TIMEOUT,
} from '@/constants/result';
import { refreshToken } from '@/api/auth';

/** 响应结果类型 */
export type ResultType = {
  /** 响应码 */
  code: number;
  /** 信息 */
  msg: string;
  /** 数据 */
  data?: any;
  /** 未知属性（blob 响应附带 status / headers 等） */
  [key: string]: any;
};

/** 防止重复提交类型 */
type RepeatSubmitType = {
  /** 请求地址 */
  url: string;
  /** 请求数据 */
  data: string;
  /** 请求时间 */
  time: number;
};

/** 请求参数类型 */
type OptionsType = {
  /** 请求的根域名地址-不带/后缀 */
  baseUrl?: string;
  /** 超时时间，毫秒 */
  timeout?: number;
  /** 请求地址 */
  url: string;
  /** 请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 请求头 */
  headers?: HeadersInit;
  /** 地址栏参数 */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** 发送数据 */
  data?: Record<string, any> | FormData | object;
  /** 请求数据类型 */
  dataType?: 'form-data' | 'json';
  /** 响应数据类型 */
  responseType?: 'text' | 'json' | 'blob' | 'arrayBuffer';
  /** 请求缓存策略 */
  cache?: RequestCache;
  /** 请求的凭证 */
  credentials?: RequestCredentials;
  /** 请求体 */
  body?: BodyInit;
  /** 防止数据重复提交 */
  repeatSubmit?: boolean;
  /** 携带授权Token请求头 */
  withToken?: boolean;
  /** 控制请求终止 */
  signal?: AbortSignal;
};

/** 默认请求参数 */
const FETCH_OPTIONS: OptionsType = {
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 10 * 1000,
  url: '',
  method: 'GET',
  headers: {
    [APP_REQUEST_HEADER_CODE]: import.meta.env.VITE_APP_CODE,
    [APP_REQUEST_HEADER_VERSION]: import.meta.env.VITE_APP_VERSION,
  },
  dataType: 'json',
  responseType: 'json',
  cache: 'no-cache',
  credentials: undefined,
  repeatSubmit: true,
  withToken: true,
};

// ==================== Token 刷新 ====================

/** 当前刷新请求；并发刷新共用同一个 Promise */
let refreshingTokenPromise: Promise<ResultType> | null = null;

/** 需要走登录失效流程的业务码集合 */
const AUTH_FAILURE_CODES = [401001, 401002, 401003, 401004];

function isAuthFailureCode(code: number) {
  return AUTH_FAILURE_CODES.includes(code);
}

function forceLogout() {
  void import('@/plugins/authSession').then(({ forceAuthLogout }) => {
    return forceAuthLogout();
  });
}

function hasTokenPair(result: ResultType) {
  return Boolean(
    result.data?.access_token &&
      result.data?.expires_in &&
      result.data?.refresh_token &&
      result.data?.refresh_expires_in
  );
}

function authError(msg?: string): ResultType {
  return { code: RESULT_CODE_ERROR, msg: msg || '登录已过期，请重新登录' };
}

/**
 * 使用 refresh token 换取新的 token 组。
 * 单飞执行：并发触发时共用同一次刷新请求，避免旧 refresh token 被重复轮换。
 */
export async function ensureAccessToken(): Promise<ResultType> {
  if (refreshingTokenPromise) return refreshingTokenPromise;

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return authError();

  refreshingTokenPromise = (async () => {
    let result: ResultType;
    try {
      result = await refreshToken(currentRefreshToken);
    } catch (error: any) {
      result = {
        code: RESULT_CODE_EXCEPTION,
        msg: error?.message || RESULT_MSG_SERVER_ERROR,
      };
    }

    const success = result.code === RESULT_CODE_SUCCESS && hasTokenPair(result);
    if (success) {
      setAccessToken(result.data.access_token, result.data.expires_in);
      setRefreshToken(
        result.data.refresh_token,
        result.data.refresh_expires_in
      );
    }

    // 网络超时、服务异常不清理 refresh token；明确的登录失效才退出。
    if (!success && isAuthFailureCode(result.code)) forceLogout();
    return result;
  })().finally(() => {
    refreshingTokenPromise = null;
  });

  return refreshingTokenPromise;
}

// ==================== 请求前拦截 ====================

/**
 * 请求前的拦截处理
 * 负责设置请求头、token注入、参数序列化、防重复提交
 * 注意：此函数会**原地修改** options 的 url / headers / body 等字段
 *
 * @param options - 请求参数（会被直接修改）
 * @returns 处理后的请求参数，或防重复提交被触发时的错误结果
 */
function beforeRequest(
  options: OptionsType
): OptionsType | Promise<ResultType> {
  options.headers = Object.assign({}, options.headers);

  // 使用apifoxmock.com时开启
  if (import.meta.env.DEV || options.baseUrl?.includes('apifoxmock.com')) {
    Reflect.set(
      options.headers,
      'apifoxToken',
      '0KoMW8oFm5ruPw8HtaAlcQZP2YsZkbS1'
    );
  }

  // 给发送数据类型设置请求头
  if (options.dataType === 'json') {
    Reflect.set(
      options.headers,
      'content-type',
      'application/json;charset=utf-8'
    );
  }

  // 是否需要设置 token
  const accessToken = getAccessToken();
  if (options.withToken && accessToken) {
    Reflect.set(
      options.headers,
      TOKEN_KEY,
      TOKEN_KEY_PREFIX + ' ' + accessToken
    );
  }

  // 是否需要防止数据重复提交
  if (
    options.repeatSubmit &&
    options.dataType === 'json' &&
    !(options.data instanceof FormData) &&
    ['post', 'put'].includes(options.method)
  ) {
    const requestObj: RepeatSubmitType = {
      url: options.url,
      data: JSON.stringify(options.data) || '',
      time: Date.now(),
    };
    const sessionObj: RepeatSubmitType = sessionGetJSON(CACHE_SESSION_FETCH);
    if (sessionObj) {
      const { url, data, time } = sessionObj;
      const interval = 3 * 1000; // 间隔时间(ms)，小于此时间视为重复提交
      if (
        requestObj.url === url &&
        requestObj.data === data &&
        requestObj.time - time < interval
      ) {
        console.warn(`[${url}]: ${RESULT_MSG_RESUBMIT}`);
        return Promise.resolve({
          code: RESULT_CODE_ERROR,
          msg: RESULT_MSG_RESUBMIT,
        });
      } else {
        sessionSetJSON(CACHE_SESSION_FETCH, requestObj);
      }
    } else {
      sessionSetJSON(CACHE_SESSION_FETCH, requestObj);
    }
  }

  // 请求拼接地址栏参数
  if (options.params) {
    const params = options.params;
    const queryParams: string[] = [];
    for (const key in params) {
      const value = params[key];
      // 空字符串、undefined、null 的值不作为参数发送
      if (value === '' || value === undefined || value === null) continue;
      const str = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      queryParams.push(str);
    }
    const paramStr = queryParams.join('&');
    if (paramStr) {
      const separator = options.url.includes('?') ? '&' : '?';
      options.url += `${separator}${paramStr}`;
    }
  }

  if (options.method === 'GET') return options;

  // 非GET参数提交
  if (options.data instanceof FormData) {
    options.body = options.data;
  } else {
    options.body = JSON.stringify(options.data);
  }
  return options;
}

// ==================== 响应后拦截 ====================

/**
 * 响应后的拦截处理
 * 统一处理token过期刷新，其他错误码直接透传给调用方
 *
 * @param originalOptions - 未被 beforeRequest 修改的**原始**请求参数（用于token刷新后重试）
 * @param res - 响应结果
 * @returns 处理后的响应结果
 */
async function beforeResponse(
  originalOptions: OptionsType,
  res: ResultType
): Promise<ResultType> {
  // 只有携带 access token 的业务请求，才需要在刷新后重放。
  // refresh-token 接口自身返回 401001 时，直接交回 ensureAccessToken 处理。
  if (res.code === 401001 && originalOptions.withToken) {
    const result = await ensureAccessToken();
    if (result.code === RESULT_CODE_SUCCESS && hasTokenPair(result)) {
      return request(originalOptions);
    }
    return authError(result.msg);
  }

  if (originalOptions.withToken && isAuthFailureCode(res.code)) forceLogout();

  return res;
}

// ==================== 通用HTTP请求 ====================

/**
 * 通用HTTP请求函数
 *
 * 封装fetch API，统一处理请求拦截、响应拦截、超时控制、token刷新等逻辑。
 * 始终返回 ResultType，不会抛出业务异常。
 *
 * @param options - 请求参数
 * @returns 响应结果
 *
 * @example
 * ```ts
 * const res = await request({ url: '/api/user', method: 'GET' });
 * if (isSuccess(res)) { console.log(res.data); }
 * ```
 */
export async function request(options: OptionsType): Promise<ResultType> {
  const reqOptions = Object.assign({}, FETCH_OPTIONS, options);

  if (reqOptions.withToken && !getAccessToken() && getRefreshToken()) {
    const refreshResult = await ensureAccessToken();
    if (!getAccessToken()) return authError(refreshResult.msg);
  }

  /**
   * 保存合并后的原始参数副本，用于 token 刷新后重试。
   *
   * beforeRequest 会原地修改 reqOptions（拼接 params 到 url、设置 body），
   * 随后 URL 构造会将 baseUrl 拼到 url 前面。
   * 如果重试时传入被修改后的 reqOptions，会导致：
   *   1. params 被重复拼接（pageNum=1&pageSize=50&pageNum=1&pageSize=50）
   *   2. 当 baseUrl 为相对路径（如 /dev-api）时，url 不以 http 开头，
   *      URL 构造会再次拼接 baseUrl（/dev-api/dev-api/system/user/list）
   */
  const originalOptions: OptionsType = { ...reqOptions };

  // 请求超时控制
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (!reqOptions.signal) {
    const controller = new AbortController();
    reqOptions.signal = controller.signal;
    timeoutId = setTimeout(() => {
      controller.abort();
    }, reqOptions.timeout);
  }

  // 请求前拦截（防重复提交等）
  const beforeReq = beforeRequest(reqOptions);
  if (beforeReq instanceof Promise) {
    // 防重复提交被触发，直接返回错误
    clearTimeout(timeoutId!);
    return await beforeReq;
  }
  // beforeRequest 是 in-place 修改 reqOptions，此处无需再 assign

  // 拼接完整URL
  if (!reqOptions.url.startsWith('http')) {
    const uri = reqOptions.url.startsWith('/')
      ? reqOptions.url
      : `/${reqOptions.url}`;
    reqOptions.url = reqOptions.baseUrl + uri;
  }

  try {
    const res = await fetch(reqOptions.url, reqOptions);

    switch (reqOptions.responseType) {
      case 'text': {
        const str = await res.text();
        if (!res.ok) {
          return {
            code: RESULT_CODE_EXCEPTION,
            msg: str || `请求失败(${res.status})`,
          };
        }
        return {
          code: RESULT_CODE_SUCCESS,
          msg: str,
        };
      }
      case 'json': {
        let result: ResultType;
        try {
          result = await res.json();
        } catch {
          return {
            code: RESULT_CODE_EXCEPTION,
            msg: res.ok ? RESULT_MSG_SERVER_ERROR : `请求失败(${res.status})`,
          };
        }
        // 登录失效码无论 HTTP 状态码如何，都必须走 beforeResponse 处理 token 刷新
        // 否则 HTTP 401 + code:401001 会被 !res.ok 短路，导致 token 刷新永远不会触发
        if (isAuthFailureCode(result.code)) {
          return await beforeResponse(originalOptions, result);
        }
        if (!res.ok) {
          return {
            code: result.code || RESULT_CODE_EXCEPTION,
            msg: result.msg || `请求失败(${res.status})`,
            data: result.data,
          };
        }
        return await beforeResponse(originalOptions, result);
      }
      case 'blob':
      case 'arrayBuffer': {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.startsWith('application/json')) {
          let result: ResultType;
          try {
            result = await res.json();
          } catch {
            return {
              code: RESULT_CODE_EXCEPTION,
              msg: res.ok ? RESULT_MSG_SERVER_ERROR : `请求失败(${res.status})`,
            };
          }
          // 登录失效码无论 HTTP 状态码如何，都必须走 beforeResponse 处理 token 刷新
          if (isAuthFailureCode(result.code)) {
            return await beforeResponse(originalOptions, result);
          }
          if (!res.ok) {
            return {
              code: result.code || RESULT_CODE_EXCEPTION,
              msg: result.msg || `请求失败(${res.status})`,
              data: result.data,
            };
          }
          return await beforeResponse(originalOptions, result);
        }
        if (!res.ok) {
          return {
            code: RESULT_CODE_EXCEPTION,
            msg: `请求失败(${res.status})`,
          };
        }
        const data =
          reqOptions.responseType === 'blob'
            ? await res.blob()
            : await res.arrayBuffer();
        return {
          code: RESULT_CODE_SUCCESS,
          msg: RESULT_MSG_SUCCESS,
          data: data,
          status: res.status,
          headers: res.headers,
        };
      }
      default:
        return {
          code: RESULT_CODE_ERROR,
          msg: RESULT_MSG_NOT_TYPE,
        };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        code: RESULT_CODE_ERROR,
        msg: RESULT_MSG_TIMEOUT,
      };
    }
    return {
      code: RESULT_CODE_EXCEPTION,
      msg: RESULT_MSG_SERVER_ERROR,
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }
}

// ==================== 响应结果工具函数 ====================

/**
 * 判断请求是否成功
 * @param res - 请求响应结果
 * @returns 是否成功
 */
export function isSuccess(res: ResultType): boolean {
  return res.code === RESULT_CODE_SUCCESS;
}
