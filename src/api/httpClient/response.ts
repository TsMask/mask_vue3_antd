import {
  RESULT_CODE_ERROR,
  RESULT_CODE_EXCEPTION,
  RESULT_CODE_SUCCESS,
  RESULT_MSG_NOT_TYPE,
  RESULT_MSG_SERVER_ERROR,
  RESULT_MSG_SUCCESS,
} from '@/constants/result';
import { TOKEN_EXPIRED_CODE } from './tokenRefresh';
import type { RequestOptions, ResultType } from './types';

type ResponseType = NonNullable<RequestOptions['responseType']>;

export async function parseResponse(
  response: Response,
  responseType: ResponseType,
  onTokenExpired: (result: ResultType) => Promise<ResultType>
): Promise<ResultType> {
  switch (responseType) {
    case 'text':
      return parseTextResponse(response);
    case 'json':
      return parseJsonResponse(response, onTokenExpired);
    case 'blob':
    case 'arrayBuffer':
      return parseBinaryResponse(response, onTokenExpired, responseType);
    default:
      return {
        code: RESULT_CODE_ERROR,
        msg: RESULT_MSG_NOT_TYPE,
      };
  }
}

function requestFailed(response: Response): string {
  return `请求失败(${response.status})`;
}

async function parseTextResponse(response: Response): Promise<ResultType> {
  const text = await response.text();
  if (!response.ok) {
    return {
      code: RESULT_CODE_EXCEPTION,
      msg: text || requestFailed(response),
    };
  }

  return {
    code: RESULT_CODE_SUCCESS,
    msg: text,
  };
}

async function parseJsonResponse(
  response: Response,
  onTokenExpired: (result: ResultType) => Promise<ResultType>
): Promise<ResultType> {
  const result = await readJsonResponse(response);
  if (!result) return invalidJsonResult(response);
  return handleJsonResult(response, result, onTokenExpired);
}

async function parseBinaryResponse(
  response: Response,
  onTokenExpired: (result: ResultType) => Promise<ResultType>,
  responseType: 'blob' | 'arrayBuffer'
): Promise<ResultType> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('application/json')) {
    if (!response.ok) {
      return {
        code: RESULT_CODE_EXCEPTION,
        msg: requestFailed(response),
      };
    }

    return {
      code: RESULT_CODE_SUCCESS,
      msg: RESULT_MSG_SUCCESS,
      data:
        responseType === 'blob'
          ? await response.blob()
          : await response.arrayBuffer(),
      status: response.status,
      headers: response.headers,
    };
  }

  const result = await readJsonResponse(response);
  if (!result) return invalidJsonResult(response);
  return handleJsonResult(response, result, onTokenExpired);
}

async function readJsonResponse(
  response: Response
): Promise<ResultType | null> {
  try {
    return (await response.json()) as ResultType;
  } catch {
    return null;
  }
}

function invalidJsonResult(response: Response): ResultType {
  return {
    code: RESULT_CODE_EXCEPTION,
    msg: response.ok ? RESULT_MSG_SERVER_ERROR : requestFailed(response),
  };
}

async function handleJsonResult(
  response: Response,
  result: ResultType,
  onTokenExpired: (result: ResultType) => Promise<ResultType>
): Promise<ResultType> {
  if (result.code === TOKEN_EXPIRED_CODE) return onTokenExpired(result);

  if (!response.ok) {
    return {
      code: result.code || RESULT_CODE_EXCEPTION,
      msg: result.msg || requestFailed(response),
      data: result.data,
    };
  }

  return result;
}
