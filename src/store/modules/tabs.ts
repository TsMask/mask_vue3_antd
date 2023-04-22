import { defineStore } from 'pinia';
import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router';

/**导航标签栏类型 */
type TabsStore = {
  /**标签列表 */
  tabs: TabType[];
  /**激活标签项 */
  activePath: string;
  /**缓存页面路由名称 */
  caches: Set<string>;
};

/**标签信息类型 */
type TabType = {
  path: string;
  query: LocationQuery;
  name: string;
  title: string;
  icon?: any;
  cache?: boolean;
};

const useTabsStore = defineStore('tabs', {
  state: (): TabsStore => ({
    tabs: [],
    activePath: '',
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
    /**清空标签项和缓存项列表 */
    clear() {
      this.tabs = [];
      this.caches.clear();
    },
    /**
     * 删除标签项
     * @param path 当期标签路由地址
     * @returns 布尔 true/false
     */
    remove(path: string) {
      if (!path) return false;
      const tabIndex = this.tabs.findIndex(tab => tab.path === path);
      if (tabIndex === -1) return false;
      // 同名称标签只剩一个时，才移除缓存
      const name = this.tabs[tabIndex].name;
      const tabs = this.tabs.filter(tab => tab.name === name);
      if (tabs.length <= 1) {
        this.cacheDelete(name);
      }
      this.tabs.splice(tabIndex, 1);
      return true;
    },
    /**
     * 添加标签项
     * @param tab 标签信息对象
     * @param index 插入指定位置，默认加到最后
     * @returns 布尔 true/false
     */
    add(tab: TabType, index?: number) {
      const { path, query, name, title, icon, cache } = tab;
      // 是否缓存
      if (cache) {
        this.cacheAdd(name);
      }
      // 获取没有才添加
      let tabIndex = this.tabs.findIndex(tab => tab.path === path);
      if (tabIndex >= 0) return false;
      const idx = index ? index : this.tabs.length;
      this.tabs.splice(idx, 0, { path, query, name, title, icon });
      return true;
    },
    /**添加缓存项
     * @param name 路由名称
     * @returns 布尔 true/false
     */
    cacheAdd(name: string) {
      if (!name) return;
      const has = this.caches.has(name);
      if (has) return;
      this.caches.add(name);
    },
    /**
     * 删除缓存项
     * @param name 路由名称
     * @returns 布尔 true/false
     */
    cacheDelete(name: string) {
      if (!name) return false;
      const has = this.caches.has(name);
      if (!has) return false;
      return this.caches.delete(name);
    },

    /**
     * 打开标签
     *
     * 动态参数会开新标签，这是考虑多信息查看才没用同一个标签打开。
     * @param raw 跳转的路由信息
     * @returns 无
     */
    tabOpen(raw: RouteLocationNormalizedLoaded) {
      // 刷新是重定向不记录
      if (raw.path.startsWith('/redirect')) return;
      // 标签缓存使用路由名称
      const name = (raw.name && raw.name.toString()) || '-';
      // 新增到当期标签后面打开，获取当期标签下标
      const tabIndex = this.tabs.findIndex(tab => tab.path === this.activePath);
      this.add(
        {
          path: raw.path,
          query: raw.query,
          name: name,
          title: raw.meta.title || '-',
          icon: raw.meta.icon || '#',
          cache: Boolean(raw.meta.cache),
        },
        tabIndex + 1
      );
      // 设置激活项
      this.activePath = raw.path;
    },
    /**
     * 关闭标签
     * @param path 当期标签路由地址
     * @returns 新跳转push路由参数
     */
    tabClose(path: string) {
      if (!path) return null;
      // 获取当前项和最后项下标
      const tabIndex = this.tabs.findIndex(tab => tab.path === path);
      if (tabIndex === -1) return null;
      const lastIndex = this.tabs.length - 1;
      let to = null;
      // 只有一项默认跳首页
      if (lastIndex === 0) {
        to = {
          path: '/index',
          query: {},
        };
      }
      // 关闭当期标签，操作第一项跳后一项
      else if (path === this.activePath && tabIndex === 0) {
        const tab = this.tabs[tabIndex + 1];
        to = {
          path: tab.path,
          query: tab.query,
        };
      }
      // 关闭当期标签，默认跳前一项
      else if (path === this.activePath && tabIndex <= lastIndex) {
        const tab = this.tabs[tabIndex - 1];
        to = {
          path: tab.path,
          query: tab.query,
        };
      }
      // 移除标签
      this.remove(path);
      return to;
    },
    /**
     * 跳转标签
     * @param path 当期标签路由地址
     * @returns 新跳转push路由参数
     */
    tabGoto(path: string) {
      if (!path) return null;
      const tab = this.tabs.find(tab => tab.path === path);
      if (!tab) return null;
      return {
        path: tab.path,
        query: tab.query,
      };
    },
  },
});

export default useTabsStore;
