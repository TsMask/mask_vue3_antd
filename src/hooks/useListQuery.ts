import { useQuery, useQueryClient, type QueryKey } from '@tanstack/vue-query';
import { type Ref, type ComputedRef, computed, watch, toRef, isRef } from 'vue';
import { isSuccess } from '@/plugins/http-fetch';
import type { ResultType } from '@/plugins/http-fetch';

/**
 * 列表查询配置项
 */
export interface UseListQueryOptions<TData = any> {
  /**
   * 查询唯一标识
   * vue-query 根据此 key 做缓存、失效、去重
   * 例: computed(() => ['userList', queryParams.value])
   */
  queryKey: Ref<QueryKey> | ComputedRef<QueryKey>;
  /**
   * 查询函数，返回 ResultType
   * 例: () => listUser(toRaw(queryParams.value))
   */
  queryFn: () => Promise<ResultType>;
  /**
   * 是否启用查询
   * 例如某些条件下不发起请求（如字典加载完成前）
   */
  enabled?: Ref<boolean> | boolean;
}

/**
 * 列表查询结果
 */
export interface UseListQueryResult<TData = any> {
  /** 响应原始数据（包含 code/msg/data） */
  result: Ref<ResultType | undefined>;
  /** 解析后的列表数据（rows） */
  listData: Ref<TData[]>;
  /** 数据总数 */
  total: Ref<number>;
  /** vue-query 的加载状态（首次加载） */
  isLoading: Ref<boolean>;
  /** vue-query 的请求中状态（包含后台刷新） */
  isFetching: Ref<boolean>;
  /** 请求是否成功 */
  isSuccess: Ref<boolean>;
  /** 手动触发重新查询 */
  refetch: () => void;
  /** vue-query 原始 query 返回值，供高级场景使用 */
  query: ReturnType<typeof useQuery<ResultType>>;
}

/**
 * 分页列表查询 hook
 *
 * 封装 vue-query 的 useQuery，适配管理后台分页列表场景。
 * 自动从 ResultType 中解析 rows/total，并通过 vue-query 管理缓存和刷新策略。
 *
 * 替代原来页面中手动编写的 fetchList + tableState.loading + setTotal + fixPageAfterDelete 模式。
 *
 * @example
 * ```ts
 * const queryParams = ref({ userName: '', pageNum: 1, pageSize: 20 });
 *
 * const { listData, total, isFetching, refetch } = useListQuery({
 *   queryKey: computed(() => ['userList', queryParams.value]),
 *   queryFn: () => listUser(toRaw(queryParams.value)),
 * });
 *
 * // 在模板中使用
 * // <a-table :data-source="listData" :loading="isFetching" :pagination="{ total }" />
 *
 * // 删除后刷新
 * await delUser(id);
 * queryClient.invalidateQueries({ queryKey: ['userList'] });
 * ```
 */
export function useListQuery<TData = any>(
  options: UseListQueryOptions<TData>
): UseListQueryResult<TData> {
  const { queryKey, queryFn, enabled } = options;
  const queryClient = useQueryClient();

  const query = useQuery<ResultType>({
    queryKey,
    queryFn,
    enabled: enabled ?? true,
  });

  /** 响应原始数据 */
  const result = computed(() => query.data.value);

  /** 解析后的列表数据（rows 或 data 数组） */
  const listData = computed<TData[]>(() => {
    const res = result.value;
    if (!res || !isSuccess(res)) return [];
    if (Array.isArray(res.data?.rows)) return res.data.rows;
    if (Array.isArray(res.data)) return res.data as TData[];
    return [];
  });

  /** 数据总数 */
  const total = computed(() => {
    const res = result.value;
    if (!res || !isSuccess(res)) return 0;
    return res.data?.total ?? 0;
  });

  /** 是否请求成功 */
  const queryIsSuccess = computed(() => {
    return query.isSuccess.value && !!result.value && isSuccess(result.value);
  });

  /** 手动触发重新查询 */
  function refetch() {
    query.refetch();
  }

  return {
    result,
    listData,
    total,
    isLoading: query.isLoading as unknown as Ref<boolean>,
    isFetching: query.isFetching as unknown as Ref<boolean>,
    isSuccess: queryIsSuccess,
    refetch,
    query,
  };
}

/**
 * 使指定 queryKey 的缓存失效，触发重新查询
 * 通常在新增/编辑/删除操作成功后调用
 *
 * @param queryKey - 要失效的查询 key
 *
 * @example
 * ```ts
 * await delUser(id);
 * invalidateList(queryClient, ['userList']);
 * ```
 */
export function invalidateList(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: QueryKey
) {
  queryClient.invalidateQueries({ queryKey });
}