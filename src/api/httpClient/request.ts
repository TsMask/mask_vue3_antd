import {
  APP_REQUEST_HEADER_CODE,
  APP_REQUEST_HEADER_VERSION,
} from '@/constants/app';
import {
  RESULT_CODE_ERROR,
  RESULT_CODE_EXCEPTION,
  RESULT_MSG_SERVER_ERROR,
  RESULT_MSG_TIMEOUT,
} from '@/constants/result';
import { getAccessToken, getRefreshToken } from '@/utils/tokenStorage';
import { prepareRequest } from './requestPrepare';
import { parseResponse } from './response';
import { authError, ensureAccessToken, hasTokenPair } from './tokenRefresh';
import { isSuccess } from './result';
import type { RequestOptions, ResultType } from './types';

const DEFAULT_REQUEST_OPTIONS: RequestOptions = {
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
  repeatSubmit: true,
  withToken: true,
};

export async function request<T = any>(
  options: RequestOptions
): Promise<ResultType<T>> {
  return requestInternal<T>(options, true);
}

async function requestInternal<T>(
  options: RequestOptions,
  canRetryAfterRefresh: boolean
): Promise<ResultType<T>> {
  const requestOptions = mergeRequestOptions(options);

  if (requestOptions.withToken && !getAccessToken() && getRefreshToken()) {
    const refreshResult = await ensureAccessToken();
    if (!getAccessToken()) return authError(refreshResult.msg);
  }

  const originalOptions = { ...requestOptions };
  const prepared = prepareRequest(requestOptions);
  if (!prepared.ok) return prepared.result;

  appendBaseUrl(prepared.options);
  const requestSignal = createRequestSignal(
    prepared.options.signal,
    prepared.options.timeout
  );

  try {
    const response = await fetch(
      prepared.options.url,
      toFetchInit(prepared.options, requestSignal.signal)
    );
    return await parseResponse(
      response,
      prepared.options.responseType || 'json',
      result => refreshAndRetry(originalOptions, canRetryAfterRefresh, result)
    );
  } catch (error) {
    if (isAbortError(error)) {
      return {
        code: RESULT_CODE_ERROR,
        msg: requestSignal.didTimeout() ? RESULT_MSG_TIMEOUT : '请求已取消',
      };
    }

    return {
      code: RESULT_CODE_EXCEPTION,
      msg: RESULT_MSG_SERVER_ERROR,
    };
  } finally {
    requestSignal.cancel();
  }
}

function mergeRequestOptions(options: RequestOptions): RequestOptions {
  const headers = new Headers(DEFAULT_REQUEST_OPTIONS.headers);
  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return {
    ...DEFAULT_REQUEST_OPTIONS,
    ...options,
    headers,
  };
}

function appendBaseUrl(options: RequestOptions) {
  if (options.url.startsWith('http')) return;

  const uri = options.url.startsWith('/') ? options.url : `/${options.url}`;
  options.url = `${options.baseUrl}${uri}`;
}

function toFetchInit(
  options: RequestOptions,
  signal: AbortSignal
): RequestInit {
  return {
    method: options.method,
    headers: options.headers,
    body: options.body,
    cache: options.cache,
    credentials: options.credentials,
    signal,
  };
}

function createRequestSignal(
  externalSignal: AbortSignal | undefined,
  timeout = 0
) {
  const controller = new AbortController();
  let timedOut = false;

  const abortWithSignal = () => controller.abort();
  const timeoutId =
    timeout > 0
      ? window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeout)
      : null;

  if (externalSignal) {
    if (externalSignal.aborted) abortWithSignal();
    else
      externalSignal.addEventListener('abort', abortWithSignal, { once: true });
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cancel() {
      if (timeoutId) window.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortWithSignal);
    },
  };
}

async function refreshAndRetry(
  originalOptions: RequestOptions,
  canRetry: boolean,
  fallbackResult: ResultType
): Promise<ResultType> {
  if (!canRetry || !originalOptions.withToken) return fallbackResult;

  const refreshResult = await ensureAccessToken();
  if (isSuccess(refreshResult) && hasTokenPair(refreshResult)) {
    return requestInternal({ ...originalOptions, repeatSubmit: false }, false);
  }

  return authError(refreshResult.msg);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
