import { reactive } from "vue";

/**
 * 通用查询参数管理 hook
 *
 * 解决的问题：
 * - 各页面重复编写 queryParams reactive 对象
 * - 各页面重复编写 Object.assign(queryParams, {...defaults}) 重置逻辑
 * - 重置查询时需要同步重置分页、重新拉取列表
 *
 * @example
 * ```ts
 * const { queryParams, resetQuery, setQuery } = useQueryParams(
 *   { name: '', status: undefined, pageNum: 1, pageSize: 20 },
 *   () => { resetPage(); fetchList(); },
 * );
 * ```
 *
 * @param defaults - 默认查询参数对象，用于重置时恢复初始值
 * @param resetCallback - 重置时的额外回调（如重置分页、重新拉取列表）
 * @returns queryParams - 响应式查询参数对象
 * @returns resetQuery - 重置查询参数到默认值并执行回调
 * @returns setQuery - 部分更新查询参数
 */
export function useQueryParams<T extends Record<string, any>>(
  defaults: T,
  resetCallback?: () => void,
) {
  /** 响应式查询参数对象 */
  const queryParams = reactive<T>({ ...defaults });

  /**
   * 重置查询参数到默认值
   * 会自动调用 resetCallback（如有）
   */
  function resetQuery() {
    Object.assign(queryParams, { ...defaults });
    resetCallback?.();
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
    resetQuery,
    setQuery,
  };
}
