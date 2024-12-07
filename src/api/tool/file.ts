import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { request } from '@/plugins/http-fetch';
import { encode } from 'js-base64';

/**
 * 下载文件
 * @param filePath 文件路径带/，如:/upload/default/2023/06/xx.png
 * @param range 断点续传标识，填入字符串 `bytes=${startByte}-${endByte}`
 * @returns object
 */
export async function downloadFile(filePath: string, range?: string) {
  return request({
    url: `/file/download/${encode(filePath)}`,
    method: 'GET',
    headers: range ? { range } : {},
    responseType: 'blob',
  });
}

/**
 * 下载文件切片
 * @param filePath 文件路径带/，如:/upload/default/2023/06/xx.png
 * @param chunkSize 数据块大小MB，默认1MB
 * @returns bolb
 */
export async function downloadFileChunk(
  filePath: string,
  chunkSize: number = 1
): Promise<Blob> {
  chunkSize = chunkSize * 1024 * 1024;
  let start = 0; // 文件块的起始字节
  let end = chunkSize - 1; // 文件块的结束字节
  let totalSize = 0; // 文件总大小
  let downloadedSize = 0; // 已下载的文件大小
  let filePart: Blob[] = []; // 文件数据块内容

  // 发送带有 Range 请求头的 HTTP 请求
  async function sendRequest() {
    const range = `bytes=${start}-${end}`;
    const res = await downloadFile(filePath, range);
    if (res.code === RESULT_CODE_SUCCESS && res.status === 206) {
      // 总大小
      const contentRange = res.headers.get('content-range') || '0/0';
      totalSize = parseInt(contentRange.split('/')[1]);
      // 已下载大小
      const contentLength = res.headers.get('content-length') || '0';
      const chunkSize = parseInt(contentLength);
      // 下一段数据块区间
      start += chunkSize;
      end = Math.min(start + chunkSize - 1, totalSize - 1);
      // 记录下载结果
      filePart.push(res.data);
      downloadedSize += chunkSize;
      // 小于总大小继续下载后续数据
      if (downloadedSize < totalSize) {
        await sendRequest();
      }
    } else {
      return res;
    }
  }

  await sendRequest();
  return new Blob(filePart, { type: 'application/octet-stream' });
}

/**
 * 上传文件
 * @param data 表单数据对象
 * @returns object
 */
export function uploadFile(data: FormData) {
  return request({
    url: '/file/upload',
    method: 'POST',
    data,
    dataType: 'form-data',
  });
}

/**
 * 上传切片文件
 * @param file 文件对象
 * @param chunkSize 数据块大小MB，默认1MB
 * @param subPath 归属子路径, 默认default
 * @returns
 */
export async function uploadFileChunk(
  fileData: File,
  chunkSize: number = 1,
  subPath: string = 'default'
) {
  const { name, size } = fileData;
  const chunkSizeInBytes = chunkSize * 1024 * 1024;
  // 文件标识使用唯一编码 MD5(文件名+文件大小)
  const fileIdentifier = `${name}-${size}`;
  // 文件切分为多少份进行上传
  const chunksCount = Math.ceil(size / chunkSizeInBytes);
  // 切块的数据数据用于上传
  const fileChunks: { index: number; chunk: Blob }[] = [];

  for (let i = 0; i < chunksCount; i++) {
    const start = i * chunkSizeInBytes;
    const end = Math.min(start + chunkSizeInBytes, size);
    fileChunks.push({
      index: i,
      chunk: fileData.slice(start, end),
    });
  }

  // 检查是否已上传部分数据块
  const resCheck = await chunkCheck(fileIdentifier, name);
  if (resCheck.code !== 200) {
    return resCheck;
  }

  let uploadedSize = 0;
  let uploadProgress = 0;

  for (const { index, chunk } of fileChunks) {
    const chunksIndex = `${index}`;
    // 跳过已上传块
    if (resCheck.data.includes(chunksIndex)) {
      continue;
    }

    // 上传数据块
    const formData = new FormData();
    formData.append('file', chunk, name);
    formData.append('index', chunksIndex);
    formData.append('identifier', fileIdentifier);

    const resUpload = await chunkUpload(formData);
    if (resUpload.code === 200) {
      uploadedSize += chunk.size;
      uploadProgress = (uploadedSize / size) * 100;
      console.log(`上传进度：${uploadProgress}%`);
    } else {
      // 上传失败处理
      break;
    }
  }

  // 上传数据完整后合并数据块
  if (uploadedSize === size) {
    return await chunkMerge(fileIdentifier, name, subPath);
  }
  return { code: 500, msg: '上传出错，请重试' };
}

/**
 * 切片文件检查
 * @param identifier 文件标识
 * @param fileName 原文件名称
 * @returns object
 */
export function chunkCheck(identifier: string, fileName: string) {
  return request({
    url: '/file/chunk-check',
    method: 'POST',
    data: { identifier, fileName },
  });
}

/**
 * 切片文件合并
 * @param identifier 文件标识
 * @param fileName 原文件名称
 * @param subPath 文件归属
 * @returns object
 */
export function chunkMerge(
  identifier: string,
  fileName: string,
  subPath: string = 'default'
) {
  return request({
    url: '/file/chunk-merge',
    method: 'POST',
    data: { identifier, fileName, subPath },
  });
}

/**
 * 切片文件上传
 * @param data 表单数据对象
 * @returns object
 */
export function chunkUpload(data: FormData) {
  return request({
    url: '/file/chunk-upload',
    method: 'POST',
    data,
    dataType: 'form-data',
  });
}
