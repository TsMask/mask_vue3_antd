import {
  RESULT_CODE_SUCCESS,
  RESULT_CODE_EXCEPTION,
  RESULT_MSG_SUCCESS,
} from '@/constants/result-constants';
import { request, isSuccess, type ResultType } from '@/plugins/http-fetch';
import { encode } from 'js-base64';

/**
 * 进度回调函数类型
 * @param percent 当前进度百分比 (0-100)
 */
export type ProgressCallback = (percent: number) => void;

/**
 * 下载文件（普通方式）
 *
 * 通过服务端返回 blob 流直接下载单个文件。
 *
 * @param filePath - 文件路径，如 /upload/default/2023/06/xx.png
 * @param range    - 断点续传 Range 头，格式 `bytes=0-1023`，不传则下载整个文件
 * @returns ResultType，成功时 data 为 Blob（附带 status / headers 扩展字段）
 */
export async function downloadFile(
  filePath: string,
  range?: string
): Promise<ResultType> {
  return request({
    url: `/api/v1/file/download/${encode(filePath)}`,
    method: 'GET',
    headers: range ? { range } : {},
    responseType: 'blob',
  });
}

/**
 * 下载文件（分片方式）
 *
 * 通过 HTTP Range 请求逐片下载，最终合并为完整 Blob。
 * 适用于大文件下载场景，支持进度回调。
 *
 * @param filePath    - 文件路径，如 /upload/default/2023/06/xx.png
 * @param chunkSizeMB - 每片大小（MB），默认 1MB
 * @param onProgress  - 可选的下载进度回调，每片完成后触发
 * @returns ResultType，成功时 data 为合并后的 Blob；失败时返回原始错误信息
 */
export async function downloadFileChunk(
  filePath: string,
  chunkSizeMB: number = 1,
  onProgress?: ProgressCallback
): Promise<ResultType> {
  const chunkSizeBytes = chunkSizeMB * 1024 * 1024;
  let start = 0;
  let end = chunkSizeBytes - 1;
  let totalSize = 0;
  let downloadedSize = 0;
  const fileParts: Blob[] = [];

  // 循环发送 Range 请求，直到下载完整文件
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const range = `bytes=${start}-${end}`;
    const res = await downloadFile(filePath, range);

    // 请求失败，直接返回错误信息（不再吞没错误）
    if (!isSuccess(res)) {
      return res;
    }

    // 服务端未返回 206 Partial Content，说明不支持 Range 或文件不存在
    if (res.status !== 206) {
      return {
        code: RESULT_CODE_EXCEPTION,
        msg: `服务端未返回分片数据(status: ${res.status})`,
      };
    }

    // 解析 Content-Range 获取文件总大小: bytes 0-1023/4096
    const contentRange = (res.headers?.get('content-range') as string) || '';
    const contentRangeTotal = contentRange.split('/')[1];
    const parsedTotal = contentRangeTotal ? parseInt(contentRangeTotal, 10) : 0;
    if (!parsedTotal || parsedTotal <= 0) {
      return {
        code: RESULT_CODE_EXCEPTION,
        msg: '服务端未返回有效的 Content-Range 头',
      };
    }
    totalSize = parsedTotal;

    // 当前片的实际字节数
    const contentLength = parseInt(
      (res.headers?.get('content-length') as string) || '0',
      10
    );
    if (!contentLength || contentLength <= 0) {
      return {
        code: RESULT_CODE_EXCEPTION,
        msg: '服务端返回空数据块，无法继续下载',
      };
    }

    fileParts.push(res.data as Blob);
    downloadedSize += contentLength;

    // 回调进度（钳制到 0-100）
    onProgress?.(Math.min(100, Math.round((downloadedSize / totalSize) * 100)));

    // 已下载完毕
    if (downloadedSize >= totalSize) break;

    // 计算下一片的字节区间
    start += contentLength;
    end = Math.min(start + contentLength - 1, totalSize - 1);
  }

  return {
    code: RESULT_CODE_SUCCESS,
    msg: RESULT_MSG_SUCCESS,
    data: new Blob(fileParts, { type: 'application/octet-stream' }),
  };
}

/**
 * 上传文件（普通方式）
 *
 * 通过 FormData 上传单个文件。
 *
 * @param data - FormData 对象，需包含 file 字段，可附带 subPath 等
 * @returns ResultType，成功时 data 包含 url / filePath 等文件信息
 */
export function uploadFile(data: FormData): Promise<ResultType> {
  return request({
    url: '/api/v1/file/upload',
    method: 'POST',
    data,
    dataType: 'form-data',
  });
}

/**
 * 上传文件（分片方式）
 *
 * 将大文件切分为多个分片逐片上传，支持断点续传。
 * 流程：chunkCheck(检查已上传分片) → 逐片 chunkUpload → chunkMerge(合并)
 *
 * @param fileData    - 要上传的 File 对象
 * @param chunkSizeMB - 每片大小（MB），默认 1MB
 * @param subPath     - 文件归属子路径，默认 'default'
 * @param onProgress  - 可选的上传进度回调，每片完成后触发
 * @returns ResultType，成功时 data 为 chunkMerge 返回的文件信息；失败时返回错误信息
 */
export async function uploadFileChunk(
  fileData: File,
  chunkSizeMB: number = 1,
  subPath: string = 'default',
  onProgress?: ProgressCallback
): Promise<ResultType> {
  const { name, size } = fileData;
  const chunkSizeBytes = chunkSizeMB * 1024 * 1024;

  // 文件标识：基于文件名+大小生成（注意：非加密哈希，极端情况下可能碰撞）
  const fileIdentifier = `${name}-${size}`;
  const chunksCount = Math.ceil(size / chunkSizeBytes);

  // 检查服务端已上传的分片索引列表
  const resCheck = await chunkCheck(fileIdentifier, name);
  if (!isSuccess(resCheck)) {
    return resCheck;
  }

  // 已上传分片索引数组（兼容 null / 非数组情况）
  const uploadedChunks: string[] = Array.isArray(resCheck.data)
    ? resCheck.data
    : [];
  let uploadedSize = 0;

  // 逐片上传
  for (let i = 0; i < chunksCount; i++) {
    const chunkIndex = `${i}`;
    const chunkStart = i * chunkSizeBytes;
    const chunkEnd = Math.min(chunkStart + chunkSizeBytes, size);
    const chunkActualSize = chunkEnd - chunkStart;

    // 该分片已上传，跳过（断点续传核心逻辑）
    if (uploadedChunks.includes(chunkIndex)) {
      uploadedSize += chunkActualSize;
      onProgress?.(Math.min(100, Math.round((uploadedSize / size) * 100)));
      continue;
    }

    // 切片并上传
    const formData = new FormData();
    formData.append('file', fileData.slice(chunkStart, chunkEnd), name);
    formData.append('index', chunkIndex);
    formData.append('identifier', fileIdentifier);

    const resUpload = await chunkUpload(formData);
    if (!isSuccess(resUpload)) {
      return resUpload;
    }

    uploadedSize += chunkActualSize;
    onProgress?.(Math.min(100, Math.round((uploadedSize / size) * 100)));
  }

  // 所有分片上传完毕，通知服务端合并
  return await chunkMerge(fileIdentifier, name, subPath);
}

/**
 * 分片上传前检查：查询服务端已存储的分片索引
 *
 * @param identifier - 文件标识（文件名-文件大小）
 * @param fileName   - 原始文件名
 * @returns ResultType，成功时 data 为已上传分片索引数组，如 ["0", "1", "2"]
 */
export function chunkCheck(
  identifier: string,
  fileName: string
): Promise<ResultType> {
  return request({
    url: '/api/v1/file/chunk-check',
    method: 'POST',
    data: { identifier, fileName },
  });
}

/**
 * 分片合并：所有分片上传完成后通知服务端合并为完整文件
 *
 * @param identifier - 文件标识（文件名-文件大小）
 * @param fileName   - 原始文件名
 * @param subPath    - 文件归属子路径，默认 'default'
 * @returns ResultType，成功时 data 包含 url / filePath / newFileName 等
 */
export function chunkMerge(
  identifier: string,
  fileName: string,
  subPath: string = 'default'
): Promise<ResultType> {
  return request({
    url: '/api/v1/file/chunk-merge',
    method: 'POST',
    data: { identifier, fileName, subPath },
  });
}

/**
 * 分片上传：上传单个数据块
 *
 * @param data - FormData 对象，需包含 file / index / identifier 字段
 * @returns ResultType
 */
export function chunkUpload(data: FormData): Promise<ResultType> {
  return request({
    url: '/api/v1/file/chunk-upload',
    method: 'POST',
    data,
    dataType: 'form-data',
  });
}
