import { defineStore } from 'pinia';

/**导航标签栏类型 */
type TabsStore = {
  /**列表 */
  tabs: Map<string, TabType>;
  /**缓存页面名称 */
  caches: Set<string>;
};

/**标签类型 */
type TabType = {
  path: string;
  name: string;
  title: string;
  icon?: any;
  cache?: boolean;
};

const useTabsStore = defineStore('tabs', {
  state: (): TabsStore => ({
    tabs: new Map(),
    caches: new Set(),
  }),
  getters: {
    /**获取导航标签栏列表 */
    getTabs(state) {
      let tabs: TabType[] = [];
      state.tabs.forEach(v => {
        tabs.push(v);
      });
      return tabs;
    },
    /**获取缓存页面名 */
    getCaches(state) {
      return [...state.caches];
    },
  },
  actions: {
    /**清空项列表 */
    clear() {
      this.tabs.clear();
    },
    /**获取项 */
    get(path: string) {
      if (!path) return false;
      const tab = this.tabs.get(path);
      if (tab) {
        return tab;
      }
      return null;
    },
    /**删除项 */
    remove(path: string) {
      if (!path) return false;
      const tab = this.tabs.get(path);
      if (tab) {
        this.tabs.delete(tab.path);
        this.removeCache(tab.name);
        return true;
      }
      return false;
    },
    /**添加项 */
    add(raw: TabType) {
      const { path, name, title, icon, cache } = raw;
      // 是否缓存
      if (cache) {
        this.addCache(name);
      }
      // 获取没有才添加
      let tab = this.tabs.get(path);
      if (tab === undefined) {
        this.tabs.set(path, { path, name, title, icon });
        return true;
      }
      return false;
    },
    /**添加缓存项 */
    addCache(name: string) {
      if (!name) return;
      this.caches.add(name);
    },
    /**删除缓存项 */
    removeCache(name: string) {
      if (!name) return false;
      const has = this.caches.has(name);
      if (has) {
        this.caches.delete(name);
        return true;
      }
      return false;
    },
  },
});

export default useTabsStore;
