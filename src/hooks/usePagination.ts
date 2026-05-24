import { reactive } from "vue";

export interface UsePaginationOptions {
  /** 默认每页条数，默认 20 */
  defaultPageSize?: number;
  /** 可选的每页条数选项，默认 ['10', '20', '50', '100'] */
  pageSizeOptions?: string[];
  /** 页码或每页条数变化时的回调，通常用于重新拉取列表 */
  onChange?: (page: number, pageSize: number) => void;
}

/**
 * 通用分页管理 hook
 *
 * 管理 a-table 分页 UI 配置，与 useListQuery 配合使用。
 *
 * @example
 * ```ts
 * const { pagination, resetPage, fixPage } = usePagination({
 *   onChange: (page, pageSize) => {
 *     queryParams.pageNum = page;
 *     queryParams.pageSize = pageSize;
 *   },
 * });
 *
 * // 删除后修正页码（在 confirmAndRun 的 onSuccess 中调用）
 * fixPage(1, total.value);
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const {
    defaultPageSize = 20,
    pageSizeOptions = ["10", "20", "50", "100"],
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
    /** 数据总数（由页面模板中通过 { ...pagination, total } 覆盖） */
    total: 0,
    /** 自定义总数显示格式 */
    showTotal: (total: number) => `总共 ${total} 条`,
    /** 页码或每页条数变化时的回调 */
    onChange: (page: number, pageSize: number) => {
      pagination.current = page;
      pagination.pageSize = pageSize;
      onChange?.(page, pageSize);
    },
  });

  /**
   * 重置分页到初始状态（第1页、默认每页条数）
   * 通常在搜索或重置查询条件时调用
   */
  function resetPage() {
    pagination.current = 1;
    pagination.pageSize = defaultPageSize;
  }

  /**
   * 删除后修正页码
   * 根据删除数量和当前总数计算最大有效页码，超出则回退
   *
   * 在 confirmAndRun / useMutationAction 的 onSuccess 中调用：
   *   fixPage(1, total.value)              — 单条删除
   *   fixPage(selectedKeys.length, total.value) — 批量删除
   *
   * @param deletedCount - 本次删除的数据条数
   * @param total - 删除前的数据总数（来自 useListQuery 的 total）
   */
  function fixPage(deletedCount: number, total: number) {
    const maxPage = Math.max(1, Math.ceil((total - deletedCount) / pagination.pageSize));
    if (pagination.current > maxPage) {
      pagination.current = maxPage;
      onChange?.(pagination.current, pagination.pageSize);
    }
  }

  return {
    pagination,
    resetPage,
    fixPage,
  };
}