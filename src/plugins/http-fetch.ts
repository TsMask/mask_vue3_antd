import { getToken } from '@/plugins/auth-token';
import { sessionGetJSON, sessionSetJSON } from '@/utils/cache-session-utils';
import { TOKEN_KEY, TOKEN_KEY_PREFIX } from '@/constants/token-constants';
import { CACHE_SESSION_FATCH } from '@/constants/cache-keys-constants';

/**响应结果类型 */
export type ResultType = {
  /**响应码 */
  code: number | 200 | 500;
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
};

/**全局配置类型 */
type ConfigType = {
  /**请求的根域名 */
  baseUrl: string;
  /**超时时间 */
  timeout: number;
};

/**默认配置 */
const FATCH_CONFIG: ConfigType = {
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 10 * 1000,
};

/**默认请求参数 */
const FATCH_OPTIONS: OptionsType = {
  url: '',
  method: 'get',
  headers: {},
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

  // 使用mock.apifox.cn时开启
  // Reflect.set(options.headers, 'apifoxToken', 'xBhhq0RbnbKByxColuCtxUKF8gEhS7lW');

  // 是否需要设置 token
  const token = getToken();
  if (options.whithToken && token) {
    Reflect.set(options.headers, TOKEN_KEY, TOKEN_KEY_PREFIX + token);
  }
  // 是否需要防止数据重复提交
  if (options.repeatSubmit && ['post', 'put'].includes(options.method)) {
    const requestObj: RepeatSubmitType = {
      url: options.url,
      data: JSON.stringify(options.data),
      time: Date.now(),
    };
    const sessionObj: RepeatSubmitType = sessionGetJSON(CACHE_SESSION_FATCH);
    if (sessionObj) {
      const { url, data, time } = sessionObj;
      const interval = 1000; // 间隔时间(ms)，小于此时间视为重复提交
      if (
        requestObj.url === url &&
        requestObj.data === data &&
        requestObj.time - time < interval
      ) {
        const message = '数据正在处理，请勿重复提交';
        console.warn(`[${url}]: ${message}`);
        return Promise.reject(message);
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
  return res;
}

/**
 * 请求http
 *
 * 泛型T extends string | ResultType | Request | ArrayBuffer | Blob
 * @param options 请求参数
 * @returns 返回 Promise结果
 */
export function request<T>(options: OptionsType): Promise<T> {
  options = Object.assign({}, FATCH_OPTIONS, options);
  // 检查请求拦截
  const beforeReq = beforeRequest(options);
  if (beforeReq instanceof Promise) {
    return beforeReq;
  }
  options = beforeReq;

  return new Promise((resolve, reject) => {
    // 判断用户传递的URL是否http或/开头
    if (!options.url.startsWith('http')) {
      const uri = options.url.startsWith('/') ? options.url : `/${options.url}`;
      options.url = FATCH_CONFIG.baseUrl + uri;
    }

    fetch(options.url, options)
      .then(res => {
        //console.log('请求结果：', res);
        if (!res.ok) {
          return reject({
            code: res.status,
            msg: res.statusText,
          });
        }

        // 根据响应数据类型返回
        switch (options.responseType) {
          case 'json': // json格式数据
            res.json().then((data: ResultType) => {
              // 请求后的拦截
              const beforeRes = interceptorResponse(data);
              if (beforeRes instanceof Promise) {
                return beforeRes;
              } else {
                return resolve(beforeRes as T);
              }
            });
            break;
          case 'text': // 文本数据
            return resolve(res.text() as T);
          case 'blob': // 二进制数据则直接返回
            return resolve(res.blob() as T);
          case 'arrayBuffer': // 二进制数据则直接返回
            return resolve(res.arrayBuffer() as T);
          default:
            return reject('未知响应数据类型');
        }
      })
      .catch(error => {
        return reject(error);
      });
  });
}
