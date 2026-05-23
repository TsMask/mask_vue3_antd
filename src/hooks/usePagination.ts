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
 * 解决的问题：
 * - 各页面重复编写 tablePagination reactive 对象（current/pageSize/total/onChange 等）
 * - 分页变化时需要同步 queryParams 并重新拉取列表
 * - 删除当前页最后一条数据后页码不回退，导致空页面
 *
 * @example
 * ```ts
 * const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
 *   onChange: (page, pageSize) => {
 *     queryParams.pageNum = page;
 *     queryParams.pageSize = pageSize;
 *     fetchList();
 *   },
 * });
 * ```
 *
 * @param options - 分页配置选项
 * @returns pagination - 响应式分页配置对象，可直接绑定到 a-table :pagination
 * @returns resetPage - 重置页码到第1页（通常在搜索/重置时调用）
 * @returns setTotal - 设置数据总数（通常在列表请求成功后调用）
 * @returns fixPageAfterDelete - 删除后修正页码，返回 true 表示需要重新拉取
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const {
    defaultPageSize = 20,
    pageSizeOptions = ["10", "20", "50", "100"],
    onChange,
  } = options;

  /** 响应式分页配置对象，可直接绑定到 ant-design-vue Table 的 :pagination */
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
   * 设置数据总数
   * 通常在列表请求成功后调用
   * @param total - 数据总数
   */
  function setTotal(total: number) {
    pagination.total = total;
  }

  /**
   * 删除数据后修正页码
   * 如果当前页数据为空且不在第1页，自动回退到上一页
   * 解决"删除当前页最后一条数据后显示空页面"的问题
   *
   * @param dataLength - 当前页数据条数
   * @returns 是否需要重新拉取列表（true = 已回退页码，需要重新请求）
   */
  function fixPageAfterDelete(dataLength: number): boolean {
    if (dataLength === 0 && pagination.current > 1) {
      pagination.current -= 1;
      return true;
    }
    return false;
  }

  return {
    pagination,
    resetPage,
    setTotal,
    fixPageAfterDelete,
  };
}
