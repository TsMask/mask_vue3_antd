import { ref, type Ref } from 'vue';
import { isSuccess } from '@/plugins/http-fetch';
import type { ResultType } from '@/plugins/http-fetch';

/** 列表查询配置项 */
export interface UseListQueryOptions {
  /**
   * API 查询函数
   * 调用 fetch() 时执行，应返回 ResultType 格式的响应
   * 例: () => listPost(toRaw(queryParams))
   */
  queryFn: () => Promise<ResultType>;
  /**
  * 外部分页对象（来自 usePagination），查询成功后自动同步 total
  * 传入后 useListQuery 会将响应的 total 写入 pagination.total
   */
  paginationRef?: { total: number };
  /**
   * 是否在 setup 阶段立即执行查询
   * 默认 true，设为 false 时需手动调用 fetch()
   */
  immediate?: boolean;
}

/** 列表查询结果 */
export interface UseListQueryResult<TData = any> {
  /** 解析后的列表数据（rows 或 data 数组），直接绑定 a-table :data-source */
  listData: Ref<TData[]>;
  /** 数据总数（用于分页） */
  total: Ref<number>;
  /** 加载状态，直接绑定 a-table :loading */
  loading: Ref<boolean>;
  /** 执行查询（调用 queryFn 并更新 listData/total） */
  fetch: () => Promise<void>;
}

/**
 * 分页列表查询 hook（纯 Vue 实现）
 *
 * 封装列表数据获取的通用逻辑：loading 状态管理、响应数据解析。
 * 页面通过 fetch() 控制何时发起请求。
 *
 * @example
 * ```ts
 * const { listData, total, loading, fetch: fetchList } = useListQuery({
 *   queryFn: () => listPost(toRaw(queryParams)),
 * });
 *
 * // 搜索
 * function handleSearch() {
 *   queryParams.pageNum = 1;
 *   fetchList();
 * }
 *
 * // 新增成功后刷新
 * onSuccess() { fetchList(); }
 * ```
 */
export function useListQuery<TData = any>(
  options: UseListQueryOptions
): UseListQueryResult<TData> {
  const { queryFn, paginationRef, immediate = true } = options;

  const listData = ref<TData[]>([]) as Ref<TData[]>;
  const total = ref(0);
  const loading = ref(false);

  /**
   * 执行查询
   * 调用 queryFn，根据响应更新 listData 和 total
   */
  async function fetch(): Promise<void> {
    loading.value = true;
    try {
      const res = await queryFn();
      if (isSuccess(res)) {
        let count = 0;
        if (Array.isArray(res.data?.rows)) {
          listData.value = res.data.rows;
          count = res.data?.total ?? 0;
        } else if (Array.isArray(res.data)) {
          listData.value = res.data as TData[];
          count = 0;
        } else {
          listData.value = [];
          count = 0;
        }
        total.value = count;
        if (paginationRef) {
          paginationRef.total = count;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  /** setup 阶段自动执行首次查询 */
  if (immediate) {
    fetch();
  }

  return {
    listData,
    total,
    loading,
    fetch,
  };
}
