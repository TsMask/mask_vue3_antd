import { reactive } from 'vue';

/**
 * 通用查询参数管理 hook
 *
 * 解决的问题：
 * - 各页面重复编写 queryParams reactive 对象
 * - 各页面重复编写 Object.assign(queryParams, {...defaults}) 重置逻辑
 * - 搜索时需要重置分页并重新拉取列表
 * - 重置时需要清空参数、重置分页并重新拉取列表
 *
 * @example
 * ```ts
 * const { queryParams, handleQuery, resetQuery, setQuery } = useQueryParams(
 *   { name: '', status: undefined, pageNum: 1, pageSize: 20 },
 *   () => { resetPage(); fetchList(); },
 * );
 * // 搜索按钮 → handleQuery（保留当前参数，触发查询）
 * // 重置按钮 → resetQuery（清空参数，触发查询）
 * ```
 *
 * @param defaults - 默认查询参数对象，用于重置时恢复初始值
 * @param callback - 搜索/重置时的共享回调（如重置分页、重新拉取列表）
 * @returns queryParams - 响应式查询参数对象
 * @returns handleQuery - 执行搜索（保留当前参数，仅调用回调）
 * @returns resetQuery - 重置查询参数到默认值并执行回调
 * @returns setQuery - 部分更新查询参数
 */
export function useQueryParams<T extends Record<string, any>>(
  defaults: T,
  callback?: () => void
) {
  /** 响应式查询参数对象 */
  const queryParams = reactive<T>({ ...defaults });

  /**
   * 搜索查询：使用当前参数执行回调
   * 搜索按钮使用此方法，不会清空已输入的查询条件
   */
  function handleQuery() {
    callback?.();
  }

  /**
   * 重置查询参数到默认值
   * 会自动调用 callback（如有）
   */
  function resetQuery() {
    Object.assign(queryParams, { ...defaults });
    callback?.();
  }

  /**
   * 部分更新查询参数
   * @param partial - 需要更新的参数片段
   */
  function setQuery(partial: Partial<T>) {
    Object.assign(queryParams, partial);
  }

  return {
    queryParams,
    handleQuery,
    resetQuery,
    setQuery,
  };
}
