import { defineStore } from 'pinia';
import { getDicts } from '@/api/system/dict/data';

/**字典参数类型 */
type DictStore = {
  /**字典数据 */
  dicts: Map<string, DictType[]>;
};

const useDictStore = defineStore('dict', {
  state: (): DictStore => ({
    dicts: new Map(),
  }),
  actions: {
    /**清空字典 */
    clearDict() {
      this.dicts.clear();
    },
    /**删除字典 */
    removeDict(key: string) {
      return this.dicts.delete(key);
    },
    /**获取字典 */
    async getDict(key: string) {
      if (!key) return [];
      let disct = this.dicts.get(key);
      if (disct === undefined) {
        const res = await getDicts(key);
        if (res.code === 200 && Array.isArray(res.data)) {
          const dictData: DictType[] = res.data.map(d => ({
            label: d.dictLabel,
            value: d.dictValue,
            elTagType: d.listClass,
            elTagClass: d.cssClass,
          }));
          this.dicts.set(key, dictData);
          disct = dictData;
        } else {
          disct = [];
        }
      }
      return disct;
    },
  },
});

export default useDictStore;
