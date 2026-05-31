import { reactive } from 'vue';

export interface UsePaginationOptions {
  /** 默认每页条数，默认 20 */
  defaultPageSize?: number;
  /** 可选的每页条数选项，默认 ['10', '20', '50', '100'] */
  pageSizeOptions?: string[];
  /** 页码或每页条数变化时的回调（来自 UI 翻页操作） */
  onChange?: (page: number, pageSize: number) => void;
}

/**
 * 通用分页管理 hook
 *
 * 管理 a-table 分页 UI 配置，配合 useListQuery 使用。
 * onChange 在 UI 翻页和 clampPage 回退页码时均会触发。
 * onChange 在 UI 翻页、resetPage 重置和 clampPage 回退页码时均会触发。
 *
 * @example
 * ```ts
 * const { pagination, resetPage, clampPage } = usePagination({
 *   onChange: (page, pageSize) => {
 *     queryParams.pageNum = page;
 *     queryParams.pageSize = pageSize;
 *     fetchList();
 *   },
 * });
 *
 * // 重置查询时（resetPage 自动触发 onChange → 同步参数 + 刷新列表）
 * handleQuery() { resetPage(); }
 *
 * // 删除后修正页码（clampPage 页码变化时自动触发 onChange → syncParams + fetchList）
 * clampPage(deletedCount);
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const {
    defaultPageSize = 20,
    pageSizeOptions = ['10', '20', '50', '100'],
    onChange,
  } = options;

  /** 响应式分页配置对象，可直接绑定到 a-table 的 :pagination */
  const pagination = reactive({
    /** 当前页码 */
    current: 1,
    /** 每页条数 */
    pageSize: defaultPageSize,
    /** 默认每页条数 */
    defaultPageSize,
    /** 可选的每页条数选项 */
    pageSizeOptions,
    /** 只有一页时是否隐藏分页器 */
    hideOnSinglePage: false,
    /** 是否显示快速跳转 */
    showQuickJumper: true,
    /** 是否显示每页条数选择器 */
    showSizeChanger: true,
    /** 数据总数 */
    total: 0,
    /** 自定义总数显示格式 */
    showTotal: (total: number) => `总共 ${total} 条`,
    /** 页码或每页条数变化时的回调（仅 UI 操作触发） */
    onChange: (page: number, pageSize: number) => {
      pagination.current = page;
      pagination.pageSize = pageSize;
      onChange?.(page, pageSize);
    },
  });

  /**
   * 重置分页到初始状态（第1页、默认每页条数）
   * 自动触发 onChange 回调，同步 queryParams 并刷新列表
   */
  function resetPage() {
    pagination.current = 1;
    pagination.pageSize = defaultPageSize;
    onChange?.(1, defaultPageSize);
  }

  /**
   * 删除后将页码钳制到合法范围，页码变化时自动触发 onChange
   *
   * 根据删除数量和当前总数计算最大有效页码，超出则回退。
   * pagination.total 由 useListQuery 通过 paginationRef 自动同步。
   * 页码变化时触发 onChange 回调，自动同步 queryParams 并刷新列表。
   *
   * @param deletedCount - 本次删除的数据条数
   */
  function clampPage(deletedCount: number) {
    const maxPage = Math.max(
      1,
      Math.ceil((pagination.total - deletedCount) / pagination.pageSize)
    );
    if (pagination.current > maxPage) {
      pagination.current = maxPage;
      onChange?.(maxPage, pagination.pageSize);
    }
  }

  return {
    pagination,
    resetPage,
    clampPage,
  };
}
