import { defineStore } from 'pinia';

/**导航标签栏类型 */
type TabsStore = {
  /**列表 */
  tabs: TabType[];
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
    tabs: [],
    caches: new Set(),
  }),
  getters: {
    /**获取导航标签栏列表 */
    getTabs(state) {
      return state.tabs;
    },
    /**获取缓存页面名 */
    getCaches(state) {
      return [...state.caches];
    },
  },
  actions: {
    /**清空项列表 */
    clear() {
      this.tabs = [];
      this.caches.clear();
    },
    /**获取项 */
    get(path: string) {
      if (!path) return false;
      const tab = this.tabs.find(tab => tab.path === path);
      return tab ? tab : null;
    },
    /**删除项 */
    remove(path: string) {
      if (!path) return false;
      const tabIndex = this.tabs.findIndex(tab => tab.path === path);
      if (tabIndex === -1) return false;
      this.removeCache(this.tabs[tabIndex].name);
      this.tabs.splice(tabIndex, 1);
      return true;
    },
    /**添加项 */
    add(raw: TabType, addIndex?: number) {
      const { path, name, title, icon, cache } = raw;
      // 是否缓存
      if (cache) {
        this.addCache(name);
      }
      // 获取没有才添加
      let tabIndex = this.tabs.findIndex(tab => tab.path === path);
      if (tabIndex >= 0) return false;
      const idx = addIndex ? addIndex : this.tabs.length;
      this.tabs.splice(idx, 0, { path, name, title, icon });
      return true;
    },
    /**添加缓存项 */
    addCache(name: string) {
      if (!name) return;
      const has = this.caches.has(name);
      if (has) return;
      this.caches.add(name);
    },
    /**删除缓存项 */
    removeCache(name: string) {
      if (!name) return false;
      const has = this.caches.has(name);
      if (!has) return false;
      return this.caches.delete(name);
    },
  },
});

export default useTabsStore;
