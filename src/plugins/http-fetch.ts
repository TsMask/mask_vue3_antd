import { getToken, removeToken } from '@/plugins/auth-token';
import { sessionGetJSON, sessionSetJSON } from '@/utils/cache-session-utils';
import { TOKEN_KEY, TOKEN_KEY_PREFIX } from '@/constants/token-constants';
import { CACHE_SESSION_FATCH } from '@/constants/cache-keys-constants';
import {
  APP_REQUEST_HEADER_CODE,
  APP_REQUEST_HEADER_VERSION,
} from '@/constants/app-constants';
import {
  RESULT_CODE_ERROR,
  RESULT_CODE_SUCCESS,
  RESULT_MSG_NOT_TYPE,
  RESULT_MSG_RESUBMIT,
  RESULT_MSG_SERVER_ERROR,
  RESULT_MSG_SUCCESS,
  RESULT_MSG_TIMEOUT,
} from '@/constants/result-constants';

/**响应结果类型 */
export type ResultType = {
  /**响应码 */
  code: number;
  /**信息 */
  msg: string;
  /**数据 */
  data?: any;
  /**未知属性 */
  [key: string]: any;
};

/**防止重复提交类型 */
type RepeatSubmitType = {
  /**请求地址 */
  url: string;
  /**请求数据 */
  data: string;
  /**请求时间 */
  time: number;
};

/**请求参数类型 */
type OptionsType = {
  /**请求的根域名地址-不带/后缀 */
  baseUrl?: string;
  /**超时时间，毫秒 */
  timeout?: number;
  /**请求地址 */
  url: string;
  /**请求方法 */
  method: 'get' | 'post' | 'put' | 'delete';
  /**请求头 */
  headers?: HeadersInit;
  /**地址栏参数 */
  params?: Record<string, string | number | boolean | undefined>;
  /**发送数据 */
  data?: Record<string, any> | FormData | object;
  /**请求数据类型 */
  dataType?: 'form-data' | 'json';
  /**响应数据类型 */
  responseType?: 'text' | 'json' | 'blob' | 'arrayBuffer';
  /**请求缓存策略 */
  cache?: RequestCache;
  /**请求的凭证，如 omit、same-origin、include */
  credentials?: RequestCredentials;
  /**请求体 */
  body?: BodyInit;
  /**防止数据重复提交 */
  repeatSubmit?: boolean;
  /**携带授权Token请求头 */
  whithToken?: boolean;
  /**控制请求终止，设置timeout无效 */
  signal?: AbortSignal;
};

/**默认请求参数 */
const FATCH_OPTIONS: OptionsType = {
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 10 * 1000,
  url: '',
  method: 'get',
  headers: {
    [APP_REQUEST_HEADER_CODE]: import.meta.env.VITE_APP_CODE,
    [APP_REQUEST_HEADER_VERSION]: import.meta.env.VITE_APP_VERSION,
    // 使用mock.apifox.cn时开启
    apifoxToken: '8zCzh3vipdEwd1ukv9lQEuTekdWIH7xN',
  },
  dataType: 'json',
  responseType: 'json',
  cache: 'no-cache',
  credentials: undefined,
  repeatSubmit: true,
  whithToken: true,
};

/**请求前的拦截 */
function beforeRequest(options: OptionsType): OptionsType | Promise<any> {
  options.headers = Object.assign({}, options.headers);
  //console.log('请求前的拦截', options);

  // 给发送数据类型设置请求头
  if (options.dataType === 'json') {
    Reflect.set(
      options.headers,
      'content-type',
      'application/json;charset=utf-8'
    );
  }

  // 是否需要设置 token
  const token = getToken();
  if (options.whithToken && token) {
    Reflect.set(options.headers, TOKEN_KEY, TOKEN_KEY_PREFIX + token);
  }
  // 是否需要防止数据重复提交
  if (
    options.repeatSubmit &&
    options.dataType === 'json' &&
    ['post', 'put'].includes(options.method)
  ) {
    const requestObj: RepeatSubmitType = {
      url: options.url,
      data: JSON.stringify(options.data) || '',
      time: Date.now(),
    };
    const sessionObj: RepeatSubmitType = sessionGetJSON(CACHE_SESSION_FATCH);
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
        sessionSetJSON(CACHE_SESSION_FATCH, requestObj);
      }
    } else {
      sessionSetJSON(CACHE_SESSION_FATCH, requestObj);
    }
  }

  // get请求拼接地址栏参数
  if (options.method === 'get' && options.params) {
    let paramStr = '';
    const params = options.params;
    for (const key in params) {
      const value = params[key];
      // 空字符或未定义的值不作为参数发送
      if (value === '' || value === undefined) continue;
      paramStr += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    if (paramStr && paramStr.startsWith('&')) {
      options.url = `${options.url}?${paramStr.substring(1)}`;
    }
  }

  // 非get参数提交
  if (options.data instanceof FormData) {
    options.body = options.data;
  } else {
    options.body = JSON.stringify(options.data);
  }
  return options;
}

/**请求后的拦截 */
function interceptorResponse(res: ResultType): ResultType | Promise<any> {
  //console.log('请求后的拦截', res);
  // 登录失效时，移除授权令牌并重新刷新页面
  if (res.code === 401) {
    removeToken();
    window.location.reload();
  }
  return res;
}

/**
 * 请求http
 *
 * @param options 请求参数
 *
 * responseType改变响应结果类型
 * @returns 返回 Promise<ResultType>
 */
export async function request(options: OptionsType): Promise<ResultType> {
  options = Object.assign({}, FATCH_OPTIONS, options);

  // 请求超时控制请求终止
  let timeoutId: any = 0;
  if (!options.signal) {
    const controller = new AbortController();
    options.signal = controller.signal;
    timeoutId = setTimeout(() => {
      controller.abort(); // 终止请求
    }, options.timeout);
  }

  // 检查请求拦截
  const beforeReq = beforeRequest(options);
  if (beforeReq instanceof Promise) {
    return await beforeReq;
  }
  options = beforeReq;

  // 判断用户传递的URL是否http或/开头
  if (!options.url.startsWith('http')) {
    const uri = options.url.startsWith('/') ? options.url : `/${options.url}`;
    options.url = options.baseUrl + uri;
  }

  try {
    const res = await fetch(options.url, options);
    // console.log('请求结果：', res);
    if (res.status === 500) {
      return {
        code: RESULT_CODE_ERROR,
        msg: RESULT_MSG_SERVER_ERROR,
      };
    }

    // 根据响应数据类型返回
    switch (options.responseType) {
      case 'text': // 文本数据
        const str = await res.text();
        return {
          code: RESULT_CODE_SUCCESS,
          msg: str,
        };
      case 'json': // json格式数据
        const result = await res.json();
        // 请求后的拦截
        const beforeRes = interceptorResponse(result);
        if (beforeRes instanceof Promise) {
          return await beforeRes;
        }
        return result;
      case 'blob': // 二进制数据则直接返回
      case 'arrayBuffer':
        const contentType = res.headers.get('content-type') || '';
        if (contentType.startsWith('application/json')) {
          const result = await res.json();
          return result as ResultType;
        }
        const data =
          options.responseType === 'blob'
            ? await res.blob()
            : await res.arrayBuffer();
        return {
          code: RESULT_CODE_SUCCESS,
          msg: RESULT_MSG_SUCCESS,
          data: data,
          status: res.status,
          headers: res.headers,
        };
      default:
        return {
          code: RESULT_CODE_ERROR,
          msg: RESULT_MSG_NOT_TYPE,
        };
    }
  } catch (error: any) {
    // 请求被终止时
    if (error.name === 'AbortError') {
      return {
        code: RESULT_CODE_ERROR,
        msg: RESULT_MSG_TIMEOUT,
      };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId); // 清除超时计时器
  }
}
