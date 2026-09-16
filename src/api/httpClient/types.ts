export type ResultType<T = any> = {
  code: number;
  msg: string;
  data?: T;
  /** Binary responses also carry status and headers. */
  [key: string]: any;
};

export interface AccessTokenPayload {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface RequestOptions {
  baseUrl?: string;
  timeout?: number;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: Record<string, any> | FormData | object;
  dataType?: 'form-data' | 'json';
  responseType?: 'text' | 'json' | 'blob' | 'arrayBuffer';
  cache?: RequestCache;
  credentials?: RequestCredentials;
  body?: BodyInit;
  repeatSubmit?: boolean;
  withToken?: boolean;
  signal?: AbortSignal;
}

export interface BinaryResultType<T = Blob> extends ResultType<T> {
  data: T;
  status: number;
  headers: Headers;
}

export type TokenRefreshFunction = (
  refreshToken: string
) => Promise<ResultType<AccessTokenPayload>>;
