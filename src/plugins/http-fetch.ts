import {
  getAccessToken,
  setAccessToken,
  delAccessToken,
  getRefreshToken,
  setRefreshToken,
  delRefreshToken,
} from '@/plugins/auth-token';
import { sessionGetJSON, sessionSetJSON } from '@/utils/cache-session-utils';
import { TOKEN_KEY, TOKEN_KEY_PREFIX } from '@/constants/token-constants';
import { CACHE_SESSION_FETCH } from '@/constants/cache-keys-constants';
import {
  APP_REQUEST_HEADER_CODE,
  APP_REQUEST_HEADER_VERSION,
} from '@/constants/app-constants';
import {
  RESULT_CODE_ERROR,
  RESULT_CODE_EXCEPTION,
  RESULT_CODE_SUCCESS,
  RESULT_MSG_NOT_TYPE,
  RESULT_MSG_RESUBMIT,
  RESULT_MSG_SERVER_ERROR,
  RESULT_MSG_SUCCESS,
  RESULT_MSG_TIMEOUT,
} from '@/constants/result-constants';
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

// ==================== Token 刷新队列 ====================

/** 是否正在刷新token */
let isRefreshingToken = false;
/** 等待token刷新完成的请求队列 */
let pendingRequestsQueue: Array<{
  /** 刷新成功后重放请求的函数 */
  resolve: (value: ResultType | PromiseLike<ResultType>) => void;
  /** 刷新失败后拒绝请求的函数 */
  reject: (reason?: any) => void;
  /** 待重放的请求参数（未经 beforeRequest 修改的原始参数） */
  options: OptionsType;
}> = [];

/**
 * 是否正在执行强制登出（防止 window.location.reload 被多次触发）
 * 页面 reload 后模块重新执行，该标志自然重置为 false
 */
let isForceLoggingOut = false;

/**
 * 处理token刷新队列
 * 刷新成功：重放所有等待中的请求
 * 刷新失败：立即清除 token，延迟刷新页面（确保 reject 能被调用方 catch 处理）
 *
 * @param isSuccess - 刷新是否成功
 * @param refreshResult - 刷新接口返回的结果
 */
function processPendingQueue(isSuccess: boolean, refreshResult?: ResultType) {
  const queue = pendingRequestsQueue;
  pendingRequestsQueue = [];
  isRefreshingToken = false;

  if (isSuccess) {
    // 刷新成功，重放所有等待中的请求
    for (const { resolve, options } of queue) {
      resolve(request(options));
    }
  } else {
    // 刷新失败，拒绝所有等待中的请求
    const error: ResultType = {
      code: RESULT_CODE_ERROR,
      msg: refreshResult?.msg || '登录已过期，请重新登录',
    };
    for (const { reject } of queue) {
      reject(error);
    }
    // 立即清除 token（不延迟），防止路由守卫在 token 未清除时重复触发刷新
    delAccessToken();
    delRefreshToken();
    // 延迟刷新页面，确保 reject 回调有时间被调用方处理
    // 使用 isForceLoggingOut 标志防止多次触发
    if (!isForceLoggingOut) {
      isForceLoggingOut = true;
      setTimeout(() => {
        window.location.reload();
      }, 0);
    }
  }
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
function beforeRequest(options: OptionsType): OptionsType | Promise<ResultType> {
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

/** 需要走 token 刷新流程的登录失效业务码集合 */
const AUTH_FAILURE_CODES = [401001, 401002, 401003];

/**
 * 判断业务码是否属于登录失效
 * @param code - 业务响应码
 * @returns 是否为登录失效码
 */
function isAuthFailureCode(code: number): boolean {
  return AUTH_FAILURE_CODES.includes(code);
}

/**
 * 响应后的拦截处理
 * 统一处理token过期刷新（带并发队列），其他错误码直接透传给调用方
 *
 * @param originalOptions - 未被 beforeRequest 修改的**原始**请求参数（用于token刷新后重试）
 * @param res - 响应结果
 * @returns 处理后的响应结果
 */
async function beforeResponse(
  originalOptions: OptionsType,
  res: ResultType
): Promise<ResultType> {
  // 登录过期时，刷新token并重放请求
  if (res.code === 401001) {
    // 如果已经在刷新中，将当前请求加入等待队列
    if (isRefreshingToken) {
      return new Promise<ResultType>((resolve, reject) => {
        pendingRequestsQueue.push({ resolve, reject, options: originalOptions });
      });
    }

    // 标记开始刷新，锁定后续401请求进入队列
    isRefreshingToken = true;

    try {
      const result = await refreshToken(getRefreshToken());
      if (result.code === RESULT_CODE_SUCCESS) {
        // 刷新成功，更新token
        setAccessToken(result.data.accessToken, result.data.refreshExpiresIn);
        setRefreshToken(result.data.refreshToken, result.data.refreshExpiresIn);
        // 使用原始参数重放当前请求（未被 beforeRequest 修改，参数不会重复拼接）
        const retriedResult = await request(originalOptions);
        // 释放队列中的等待请求
        processPendingQueue(true);
        return retriedResult;
      } else {
        // 刷新失败，拒绝所有等待请求
        processPendingQueue(false, result);
        return {
          code: RESULT_CODE_ERROR,
          msg: result.msg || '登录已过期，请重新登录',
        };
      }
    } catch (error: any) {
      // 刷新接口本身异常
      processPendingQueue(false, { code: RESULT_CODE_ERROR, msg: error?.message });
      return {
        code: RESULT_CODE_ERROR,
        msg: '登录已过期，请重新登录',
      };
    }
  }

  // 其他登录失效码（401002 / 401003），清除token并跳转登录
  if ([401002, 401003].includes(res.code)) {
    delAccessToken();
    delRefreshToken();
    if (!isForceLoggingOut) {
      isForceLoggingOut = true;
      window.location.reload();
    }
  }

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
            msg: res.ok
              ? RESULT_MSG_SERVER_ERROR
              : `请求失败(${res.status})`,
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

/**
 * 安全获取响应数据
 * @param res - 请求响应结果
 * @returns 响应数据，失败时返回 undefined
 */
export function unwrapData<T = any>(res: ResultType): T | undefined {
  return res.code === RESULT_CODE_SUCCESS ? (res.data as T) : undefined;
}

/**
 * 获取响应数据，失败时抛出异常
 * @param res - 请求响应结果
 * @returns 响应数据
 * @throws 响应失败时抛出错误
 */
export function unwrapDataOrThrow<T = any>(res: ResultType): T {
  if (res.code !== RESULT_CODE_SUCCESS) {
    throw new Error(res.msg || '请求失败');
  }
  return res.data as T;
}