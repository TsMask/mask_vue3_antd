import { defineStore } from 'pinia';
import { getDictDataType } from '@/api/system/dict/data';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';

/**字典参数类型 */
type DictStore = {
  /**字典数据 */
  dicts: Record<string, DictType[]>;
};

/**进行中的字典请求：同 key 并发调用共用一次请求 */
const pendingDicts = new Map<string, Promise<DictType[]>>();

const useDictStore = defineStore('dict', {
  state: (): DictStore => ({
    dicts: {},
  }),
  actions: {
    /**清空字典 */
    clearDict() {
      this.dicts = {};
    },
    /**删除字典 */
    removeDict(key: string) {
      if (!key) return false;
      return delete this.dicts[key];
    },
    /**获取字典：命中缓存直接返回，同 key 并发请求合并为一次，失败返回空数组且不写缓存 */
    async getDict(key: string): Promise<DictType[]> {
      if (!key) return [];
      const cached = this.dicts[key];
      if (Array.isArray(cached) && cached.length > 0) return cached;

      let pending = pendingDicts.get(key);
      if (!pending) {
        pending = (async () => {
          try {
            const res = await getDictDataType(key);
            if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
              const dictData: DictType[] = res.data.map(d => ({
                label: d.data_label,
                value: d.data_value,
                tag_class: d.tag_class,
                tag_type: d.tag_type,
              }));
              if (dictData.length > 0) this.dicts[key] = dictData;
              return dictData;
            }
            return [];
          } catch {
            return [];
          }
        })();
        pendingDicts.set(key, pending);
        pending
          .catch(() => {})
          .finally(() => pendingDicts.delete(key));
      }
      return pending;
    },
  },
});

export default useDictStore;
