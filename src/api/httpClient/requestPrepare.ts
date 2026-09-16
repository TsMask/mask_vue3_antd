import { TOKEN_KEY, TOKEN_KEY_PREFIX } from '@/constants/token';
import { CACHE_SESSION_FETCH } from '@/constants/cacheKeys';
import { RESULT_CODE_ERROR, RESULT_MSG_RESUBMIT } from '@/constants/result';
import { getAccessToken } from '@/utils/tokenStorage';
import { sessionGetJSON, sessionSetJSON } from '@/utils/cacheSession';
import type { RequestOptions, ResultType } from './types';

type RepeatSubmitRecord = {
  url: string;
  data: string;
  time: number;
};

type PrepareResult =
  | { ok: true; options: RequestOptions }
  | { ok: false; result: ResultType };

const REPEAT_SUBMIT_INTERVAL = 3 * 1000;

export function prepareRequest(options: RequestOptions): PrepareResult {
  const headers = new Headers(options.headers);
  const prepared: RequestOptions = {
    ...options,
    headers,
  };

  if (prepared.dataType === 'json') {
    headers.set('content-type', 'application/json;charset=utf-8');
  }

  const accessToken = getAccessToken();
  if (prepared.withToken && accessToken) {
    headers.set(TOKEN_KEY, `${TOKEN_KEY_PREFIX} ${accessToken}`);
  }

  const repeatResult = checkRepeatSubmit(prepared);
  if (repeatResult) return { ok: false, result: repeatResult };

  appendQueryParams(prepared);
  prepareRequestBody(prepared);
  return { ok: true, options: prepared };
}

function checkRepeatSubmit(options: RequestOptions): ResultType | null {
  const canCheck =
    options.repeatSubmit &&
    options.dataType === 'json' &&
    !(options.data instanceof FormData) &&
    ['post', 'put'].includes(options.method);

  if (!canCheck) return null;

  const current: RepeatSubmitRecord = {
    url: options.url,
    data: JSON.stringify(options.data) || '',
    time: Date.now(),
  };
  const previous = sessionGetJSON(
    CACHE_SESSION_FETCH
  ) as RepeatSubmitRecord | null;

  if (
    previous &&
    current.url === previous.url &&
    current.data === previous.data &&
    current.time - previous.time < REPEAT_SUBMIT_INTERVAL
  ) {
    console.warn(`[${current.url}]: ${RESULT_MSG_RESUBMIT}`);
    return {
      code: RESULT_CODE_ERROR,
      msg: RESULT_MSG_RESUBMIT,
    };
  }

  sessionSetJSON(CACHE_SESSION_FETCH, current);
  return null;
}

function appendQueryParams(options: RequestOptions) {
  if (!options.params) return;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(options.params)) {
    if (value === '' || value === undefined || value === null) continue;
    search.append(key, String(value));
  }

  const queryString = search.toString();
  if (!queryString) return;
  options.url += options.url.includes('?')
    ? `&${queryString}`
    : `?${queryString}`;
}

function prepareRequestBody(options: RequestOptions) {
  if (options.method === 'GET') return;

  if (options.data !== undefined) {
    options.body =
      options.data instanceof FormData
        ? options.data
        : JSON.stringify(options.data);
  }
}
