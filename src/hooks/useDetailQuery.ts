import { ref, type Ref } from 'vue';
import { isSuccess } from '@/plugins/http-fetch';
import type { ResultType } from '@/plugins/http-fetch';

/** 详情查询配置项 */
export interface UseDetailQueryOptions<TData = any> {
  /**
   * 详情查询函数
   * 例: () => getUser(userId.value)
   */
  queryFn?: () => Promise<ResultType>;
}

/** 详情查询结果 */
export interface UseDetailQueryResult<TData = any> {
  /** 解析后的业务数据（res.data） */
  detail: Ref<TData | undefined>;
  /** 是否正在加载 */
  loading: Ref<boolean>;
  /**
   * 执行查询
   * 可传入查询函数，或使用构造时配置的 queryFn
   * @param queryFn - 可选，覆盖构造时的 queryFn
   */
  fetch: (queryFn?: () => Promise<ResultType>) => Promise<TData | undefined>;
}

/**
 * 详情数据查询 hook（纯 Vue 实现）
 *
 * 适用于查看/编辑弹窗中的详情数据获取。
 * 提供 fetch 方法，页面在需要时调用即可。
 *
 * @example
 * ```ts
 * const { detail, loading, fetch: fetchDetail } = useDetailQuery();
 *
 * async function openEdit(id: number) {
 *   const data = await fetchDetail(() => getUser(id));
 *   if (data) {
 *     Object.assign(form, data);
 *     modal.visible = true;
 *   }
 * }
 * ```
 */
export function useDetailQuery<TData = any>(
  options: UseDetailQueryOptions<TData> = {}
): UseDetailQueryResult<TData> {
  const { queryFn: defaultQueryFn } = options;

  const detail = ref<TData>() as Ref<TData | undefined>;
  const loading = ref(false);

  async function fetch(
    queryFn?: () => Promise<ResultType>
  ): Promise<TData | undefined> {
    const fn = queryFn ?? defaultQueryFn;
    if (!fn) return undefined;

    loading.value = true;
    try {
      const res = await fn();
      if (isSuccess(res)) {
        detail.value = res.data as TData;
        return detail.value;
      }
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  return { detail, loading, fetch };
}
