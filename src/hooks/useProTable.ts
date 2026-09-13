import {
  type ProColumns,
  useProTableData,
  useRowSelection,
  type ProSchemaValueEnumMap,
  type ProTableRequestFn,
  type UseProTableDataOptions,
  type UseProTableDataReturn,
  type UseRowSelectionOptions,
  type UseRowSelectionReturn,
} from 'antdv-pro-table';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { isSuccess, type ResultType } from '@/plugins/httpFetch';

type ProTableQueryFn = (params: Record<string, any>) => Promise<ResultType>;

export interface UseProTableOptions<T = Record<string, any>>
  extends Omit<UseProTableDataOptions<T>, 'request'> {
  /** 项目 API 列表查询函数 */
  queryFn: ProTableQueryFn;
  /** 行选择字段或取 key 函数 */
  rowKey?: UseRowSelectionOptions<T>['rowKey'];
  /** 行选择的其余配置 */
  selection?: Omit<UseRowSelectionOptions<T>, 'dataSource' | 'rowKey'>;
}

export type UseProTableReturn<T = Record<string, any>> =
  UseProTableDataReturn<T> & UseRowSelectionReturn<T>;

/** 将项目接口的 current/pageSize 与 { rows, total } 响应转换为 ProTable 请求 */
function createProTableRequest<T = Record<string, any>>(
  queryFn: ProTableQueryFn,
): ProTableRequestFn<T> {
  return async (params, sort) => {
    const { current, pageSize, ...searchParams } = params;
    const sortText = Object.entries(sort)
      .map(([field, order]) => `${field}:${order === 'ascend' ? 'asc' : 'desc'}`)
      .join(',');

    const requestParams: Record<string, any> = {
      ...searchParams,
      page_num: current,
      page_size: pageSize,
    };
    if (sortText) requestParams.sort = sortText;

    const res = await queryFn(requestParams);
    const success = isSuccess(res);
    const rows = success ? res.data?.rows ?? res.data ?? [] : [];

    return {
      data: Array.isArray(rows) ? rows : [],
      total: success && Number.isFinite(Number(res.data?.total)) ? Number(res.data?.total) : 0,
      success,
    };
  };
}

/** 将字典 options 转换为 ProTable 查询表单的 valueEnum */
export function toProValueEnum(
  options: Array<{ label: any; value: any }> = [],
): ProSchemaValueEnumMap {
  return Object.fromEntries(options.map(item => [item.value, { text: item.label }]));
}

/** 计算表格横向滚动宽度：优先取列声明的 width，未声明的列按默认宽度兜底 */
export function useProTableScroll(
  columns: MaybeRefOrGetter<ProColumns[]>,
  options?: { defaultColumnWidth?: number; y?: string | number },
) {
  const defaultColumnWidth = options?.defaultColumnWidth ?? 120;
  return computed(() => {
    const x = toValue(columns).reduce((sum, col) => {
      const width = Number(col?.width ?? defaultColumnWidth);
      return sum + (Number.isFinite(width) && width > 0 ? width : defaultColumnWidth);
    }, 0);
    return { x, y: options?.y, scrollToFirstRowOnChange: true };
  });
}

/**
 * 项目级 ProTable 数据 hook。
 *
 * 在 antdv-pro-table 的数据请求、分页、排序与筛选之上，统一适配项目接口
 * 响应结构，并可选接入行选择状态。
 */
export function useProTable<T = Record<string, any>>(
  options: UseProTableOptions<T>,
): UseProTableReturn<T> {
  const { queryFn, rowKey, selection, ...dataOptions } = options;
  const tableData = useProTableData<T>({
    ...dataOptions,
    request: createProTableRequest<T>(queryFn),
  });

  /** 默认翻页保留勾选；可通过 selection.preserveSelectedRows = false 关闭 */
  const rowSelectionState = useRowSelection<T>({
    preserveSelectedRows: true,
    ...selection,
    dataSource: tableData.dataSource,
    rowKey,
  });

  return { ...tableData, ...rowSelectionState };
}
