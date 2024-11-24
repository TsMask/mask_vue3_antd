import { defineStore } from 'pinia';
import { getDictDataType } from '@/api/system/dict/data';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';

/**字典参数类型 */
type DictStore = {
  /**字典数据 */
  dicts: Map<string, DictType[]>;
};

const useDictStore = defineStore('dict', {
  state: (): DictStore => ({
    dicts: new Map<string, DictType[]>(),
  }),
  actions: {
    /**清空字典 */
    clearDict() {
      this.dicts.clear();
    },
    /**删除字典 */
    removeDict(key: string) {
      if (!key) return;
      return this.dicts.delete(key);
    },
    /**
     * 处理字典数据对象用于回显标签
     * @param data 字典数据项
     * @returns
     */
    parseDataDict(data: Record<string, any>) {
      return [
        {
          label: data.dataLabel,
          value: data.dataValue,
          tagClass: data.tagClass,
          tagType: data.tagType,
        },
      ];
    },
    /**获取字典 */
    async getDict(key: string) {
      if (!key) return [];
      let disct = this.dicts.get(key);
      if (disct === undefined || disct.length === 0) {
        const res = await getDictDataType(key);
        if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
          const dictData: DictType[] = res.data.map(d => ({
            label: d.dataLabel,
            value: d.dataValue,
            tagClass: d.tagClass,
            tagType: d.tagType,
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
