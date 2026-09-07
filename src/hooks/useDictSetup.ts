import { reactive, ref } from 'vue';
import useDictStore from '@/store/modules/dict';

export interface UseDictSetupOptions<K extends string = string> {
  /** 本地字段名到字典类型键的映射；值为固定字典数组时直接使用，不发起请求 */
  keyMap: Record<K, string | DictType[]>;
  /**
   * 是否在 setup 阶段自动加载字典数据
   * 默认 true，页面无需手动调用 loadDicts()
   * 设为 false 时需在适当时机手动调用 loadDicts()
   */
  autoLoad?: boolean;
}

/**
 * 通用字典初始化 hook
 *
 * 解决的问题：
 * - 各页面重复编写 Promise.allSettled(getDict(...)) 与赋值逻辑
 * - 各页面重复编写 onMounted(() => { loadDicts() })
 *
 * @example
 * ```ts
 * // 自动加载（默认），无需 onMounted
 * const { dict } = useDictSetup({
 *   keyMap: { sysNormalDisable: "sys_normal_disable" },
 * });
 *
 * // 固定枚举不发请求，可与远程字典混用
 * const { dict } = useDictSetup({
 *   keyMap: {
 *     sysNormalDisable: "sys_normal_disable",
 *     configValueType: [{ label: "字符", value: "string" }],
 *   },
 * });
 *
 * // 手动加载
 * const { dict, loadDicts } = useDictSetup({
 *   keyMap: { sysNormalDisable: "sys_normal_disable" },
 *   autoLoad: false,
 * });
 * onMounted(() => { loadDicts(); });
 * ```
 */
export function useDictSetup<K extends string>(
  options: UseDictSetupOptions<K>
) {
  const { keyMap, autoLoad = true } = options;
  const { getDict } = useDictStore();

  /** 字典数据加载状态 */
  const dictLoading = ref(false);

  const dict = reactive<Record<K, DictType[]>>(
    Object.entries(keyMap).reduce(
      (acc, [key, value]) => {
        acc[key as K] = Array.isArray(value) ? value : [];
        return acc;
      },
      {} as Record<K, DictType[]>
    )
  );

  /**
   * 加载所有字典数据
   * 使用 Promise.allSettled 并行加载，失败的字典项会被跳过不影响其他项
   */
  async function loadDicts() {
    dictLoading.value = true;
    try {
      const entries = Object.entries(keyMap) as [K, string | DictType[]][];
      const remoteEntries = entries.filter(
        (entry): entry is [K, string] => typeof entry[1] === 'string'
      );
      const results = await Promise.allSettled(
        remoteEntries.map(([, dictKey]) => getDict(dictKey))
      );
      remoteEntries.forEach(([localKey], index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          (dict as Record<K, DictType[]>)[localKey] =
            result.value as DictType[];
        }
      });
    } finally {
      dictLoading.value = false;
    }
  }

  /** 自动加载：在 setup 阶段立即发起字典请求，无需等待 onMounted */
  if (autoLoad) {
    loadDicts();
  }

  return {
    dict,
    dictLoading,
    loadDicts,
  };
}
