import { reactive, ref } from "vue";
import useDictStore from "@/store/modules/dict";


/**
 * 通用字典初始化 hook
 *
 * 解决的问题：
 * - 各页面重复编写 Promise.allSettled(getDict(...)) 与赋值逻辑
 * - 字典 loading 状态、错误处理不统一
 *
 * @example
 * ```ts
 * const { dict, dictLoading, loadDicts } = useDictSetup({
 *   sysNormalDisable: "sys_normal_disable",
 *   sysBusinessType: "sys_opera_type",
 * });
 *
 * onMounted(() => { loadDicts(); });
 * // 模板中使用 dict.sysNormalDisable
 * ```
 *
 * @param keyMap - 本地字段名到字典类型键的映射，如 { sysNormalDisable: "sys_normal_disable" }
 * @returns dict - 响应式字典数据对象，按 keyMap 的本地字段名存放对应字典列表
 * @returns dictLoading - 字典加载状态
 * @returns loadDicts - 启动字典数据加载
 */
export function useDictSetup(keyMap: Record<string, string>) {
  const { getDict } = useDictStore();
  /** 字典数据加载状态 */
  const dictLoading = ref(false);

  const dict = reactive<Record<string, DictType[]>>(
    Object.keys(keyMap).reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<string, DictType[]>,
    ),
  );

  /**
   * 加载所有字典数据
   * 使用 Promise.allSettled 并行加载，失败的字典项会被跳过不影响其他项
   */
  async function loadDicts() {
    dictLoading.value = true;
    try {
      const entries = Object.entries(keyMap);
      const results = await Promise.allSettled(
        entries.map(([, dictKey]) => getDict(dictKey)),
      );
      entries.forEach(([localKey], index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
          dict[localKey] = result.value as DictType[];
        }
      });
    } finally {
      dictLoading.value = false;
    }
  }

  return {
    dict,
    dictLoading,
    loadDicts,
  };
}
