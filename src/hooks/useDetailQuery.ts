import { useQuery, keepPreviousData, type QueryKey } from '@tanstack/vue-query';
import { type Ref, type ComputedRef, computed } from 'vue';
import { isSuccess } from '@/plugins/http-fetch';
import type { ResultType } from '@/plugins/http-fetch';

/** 详情查询配置项 */
export interface UseDetailQueryOptions<TData = any> {
  /**
   * 查询唯一标识
   * 通常包含业务ID，例如: computed(() => ['userDetail', userId.value])
   */
  queryKey: Ref<QueryKey> | ComputedRef<QueryKey>;
  /**
   * 查询函数
   * 例: () => getUser(userId.value)
   */
  queryFn: () => Promise<ResultType>;
  /**
   * 是否启用查询
   * 通常在 ID 有效时才发起请求
   */
  enabled?: Ref<boolean> | boolean;
}

/** 详情查询结果 */
export interface UseDetailQueryResult<TData = any> {
  /** 响应原始数据 */
  result: Ref<ResultType | undefined>;
  /** 解析后的业务数据（res.data） */
  detail: Ref<TData | undefined>;
  /** 是否正在加载 */
  isLoading: Ref<boolean>;
  /** 请求是否成功 */
  isSuccess: Ref<boolean>;
  /** 手动触发重新查询 */
  refetch: () => void;
  /** vue-query 原始返回值 */
  query: ReturnType<typeof useQuery<ResultType>>;
}

/**
 * 详情数据查询 hook
 *
 * 封装 vue-query 的 useQuery，适用于查看/编辑弹窗中的详情数据获取。
 * 自动从 ResultType 中解析 data 字段。
 *
 * @example
 * ```ts
 * const userId = ref<string | number | undefined>();
 * const { detail, isLoading } = useDetailQuery({
 *   queryKey: computed(() => ['userDetail', userId.value]),
 *   queryFn: () => getUser(userId.value!),
 *   enabled: computed(() => !!userId.value),
 * });
 * ```
 */
export function useDetailQuery<TData = any>(
  options: UseDetailQueryOptions<TData>
): UseDetailQueryResult<TData> {
  const { queryKey, queryFn, enabled } = options;

  const query = useQuery<ResultType>({
    queryKey,
    queryFn,
    enabled: enabled ?? true,
    /** 详情查询保持上一次数据，避免弹窗打开时闪烁 */
    placeholderData: keepPreviousData,
  });

  /** 响应原始数据 */
  const result = computed(() => query.data.value);

  /** 解析后的业务数据 */
  const detail = computed<TData | undefined>(() => {
    const res = result.value;
    if (!res || !isSuccess(res)) return undefined;
    return res.data as TData;
  });

  /** 是否请求成功 */
  const queryIsSuccess = computed(() => {
    return query.isSuccess.value && !!result.value && isSuccess(result.value);
  });

  function refetch() {
    query.refetch();
  }

  return {
    result,
    detail,
    isLoading: query.isLoading as unknown as Ref<boolean>,
    isSuccess: queryIsSuccess,
    refetch,
    query,
  };
}