import { reactive } from 'vue';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';

export interface UseTableUIOptions {
  /** 默认表格尺寸，默认 'middle' */
  defaultSize?: SizeType;
}

/**
 * 通用表格 UI 状态管理 hook
 *
 * 解决的问题：
 * - 各页面重复定义 TabeStateType 类型和 tableState reactive 对象
 * - 各页面重复编写 fnTableSize / fnTableStriped / fnTableSelectedRowKeys 函数
 * - 表格 size / striped / searched / selectedRowKeys 状态分散管理
 *
 * @example
 * ```ts
 * const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } = useTableUI();
 *
 * // 模板中使用
 * // <a-table :size="tableState.size" :row-class-name="rowClassName" ...>
 * ```
 *
 * @param options - 表格 UI 配置选项
 * @returns tableState - 响应式表格状态（size/striped/searched/selectedRowKeys）
 * @returns setTableSize - 设置表格密度（绑定到密度下拉菜单的 @click）
 * @returns rowClassName - 斑马纹行类名函数（绑定到 a-table :row-class-name）
 * @returns setSelectedRowKeys - 更新选中行 keys（绑定到 a-table row-selection onChange）
 * @returns clearSelection - 清空选中行（通常在列表刷新后调用）
 */
export function useTableUI(options: UseTableUIOptions = {}) {
  const { defaultSize = 'middle' } = options;

  /** 响应式表格状态 */
  const tableState = reactive({
    /** 表格密度（default/middle/small） */
    size: defaultSize as SizeType,
    /** 是否启用斑马纹 */
    striped: false,
    /** 是否显示搜索栏 */
    searched: false,
    /** 选中的行 key 数组 */
    selectedRowKeys: [] as (string | number)[],
  });

  /**
   * 设置表格密度
   * 绑定到密度下拉菜单的 @click 事件
   * @param param0 - 菜单点击事件信息，包含选中的 key
   */
  function setTableSize({ key }: MenuInfo) {
    tableState.size = key as SizeType;
  }

  /**
   * 斑马纹行类名函数
   * 绑定到 a-table 的 :row-class-name 属性
   * 奇数行添加 'table-striped' 类名（需配合 CSS 样式）
   * @returns 行类名或空字符串
   */
  function rowClassName(_record: unknown, index: number): string {
    return tableState.striped && index % 2 === 1 ? 'table-striped' : '';
  }

  /**
   * 更新选中行 keys
   * 绑定到 a-table row-selection 的 onChange 事件
   * @param keys - 选中的行 key 数组
   */
  function setSelectedRowKeys(keys: (string | number)[]) {
    tableState.selectedRowKeys = keys;
  }

  /**
   * 清空选中行
   * 通常在列表刷新、删除操作成功后调用
   */
  function clearSelection() {
    if (tableState.selectedRowKeys.length > 0) {
      tableState.selectedRowKeys = [];
    }
  }

  return {
    tableState,
    setTableSize,
    rowClassName,
    setSelectedRowKeys,
    clearSelection,
  };
}
