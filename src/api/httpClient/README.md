# HTTP Client

`httpClient` 是基于原生 `fetch` 的通用请求封装。业务接口统一从这里导入 `request`、`isSuccess` 和类型；不要直接引用目录内部模块。

## 模块职责

- `index.ts`：对外导出公共 API。
- `request.ts`：请求主流程、默认配置、URL 拼接、超时与取消。
- `requestPrepare.ts`：请求头、Token 注入、query 序列化、body 构建和防重复提交。
- `response.ts`：JSON、text、blob、arrayBuffer 响应解析。
- `responseMeta.ts`：二进制响应识别、响应头读取和 `Content-Range` 解析。
- `tokenRefresh.ts`：刷新令牌的单飞并发控制、保存与失效处理。
- `result.ts`：业务成功码判断。
- `types.ts`：请求和响应类型定义。

## 基本用法

```ts
import { isSuccess, request } from '@/api/httpClient';

const res = await request<{ id: number }>({
  url: '/api/v1/profile',
  method: 'GET',
});

if (isSuccess(res)) {
  console.log(res.data);
} else {
  console.error(res.msg);
}
```

`request` 始终返回 `ResultType`，HTTP 状态异常、超时、取消和响应解析失败也会转换为错误结果，业务层不需要用 `try/catch` 处理普通请求失败。

## 二进制响应

下载接口使用 `responseType: 'blob'` 或 `'arrayBuffer'`。二进制成功结果会附带 `status` 和 `headers`。

```ts
import { isBinaryResult, isSuccess, request } from '@/api/httpClient';

const res = await request<Blob>({
  url: '/api/v1/files/download/xxx',
  method: 'GET',
  responseType: 'blob',
});

if (isSuccess(res) && isBinaryResult<Blob>(res)) {
  console.log(res.status, res.headers, res.data.size);
}
```

分片下载等业务协议留在具体 API 模块中实现，例如 `api/tool/file.ts`。这里只提供 `parseContentRange` 等通用响应元信息工具。

## Token 与默认行为

- 默认携带访问令牌，可用 `withToken: false` 关闭。
- 默认 JSON 请求、10 秒超时、开启防重复提交。
- 后端返回 `401001` 时，会并发共享一次刷新令牌请求，并在刷新成功后重放原请求。
- 刷新函数由路由层通过 `setupHttpTokenRefresh` 注入，避免 HTTP 层反向依赖认证 API。

## 扩展约定

- 新增通用请求能力时，优先保持现有 `ResultType` 契约不变。
- 不要在 HTTP 层加入具体业务接口、弹窗、路由跳转或文件保存逻辑。
- 开发与 Mock 专用凭证不得写入源码，应通过环境变量和本地配置处理。
- 修改后运行 `npm run build` 验证类型和生产构建。
