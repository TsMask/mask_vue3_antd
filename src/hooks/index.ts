/**
 * 公共 hooks 统一导出
 *
 * 基础 UI hooks（适用于所有页面）：
 * - useQueryParams: 查询参数管理
 * - usePagination: 分页管理
 * - useTableUI: 表格 UI 状态
 * - useCrudModal: CRUD 弹窗管理
 * - useDictSetup: 字典数据初始化
 *
 * vue-query hooks（数据获取层）：
 * - useListQuery: 分页列表查询
 * - useDetailQuery: 详情数据查询
 * - useMutationAction: 增删改操作（带反馈）
 * - invalidateList: 使列表缓存失效
 * - confirmAndRun: 二次确认后执行操作
 *
 * 工具函数：
 * - isSuccess: 判断请求是否成功
 * - unwrapData: 安全获取响应数据
 * - unwrapDataOrThrow: 获取响应数据（失败抛异常）
 */

// 基础 UI hooks
export { useQueryParams } from './useQueryParams';
export { usePagination } from './usePagination';
export { useTableUI } from './useTableUI';
export { useCrudModal } from './useCrudModal';
export { useDictSetup } from './useDictSetup';
export { useLoading } from './useLoading';

// vue-query hooks
export { useListQuery, invalidateList } from './useListQuery';
export type { UseListQueryOptions, UseListQueryResult } from './useListQuery';
export { useDetailQuery } from './useDetailQuery';
export type { UseDetailQueryOptions, UseDetailQueryResult } from './useDetailQuery';
export { useMutationAction, confirmAndRun } from './useMutationAction';
export type { UseMutationActionOptions, UseMutationActionResult, ConfirmAndRunOptions } from './useMutationAction';

// 兼容导出（旧页面过渡期保留，新页面请使用 vue-query hooks）
export { useMessageAction } from './useMessageAction';