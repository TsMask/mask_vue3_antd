import { watch } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteLocationResolved } from 'vue-router';
import { HOME_PATH } from '@/constants/router';
import {
  useTabsView as useProTabsView,
  type TabLocation,
  type TabsViewAction,
  type UseTabsViewReturn,
} from 'antdv-pro-layout';

/** 标签恢复数据在 sessionStorage 中的键名 */
const RESTORE_STORAGE_KEY = 'antdv:tabs-view';
/** 标签查询参数恢复数据在 sessionStorage 中的键名 */
const RESTORE_QUERY_STORAGE_KEY = 'antdv:tabs-view-query';

/** 全局标签栏实例；antdv-pro-layout 的 useTabsView 本身也是单例，这里保留引用便于登出清理 */
let tabsViewInstance: UseTabsViewReturn | null = null;

/** 创建或获取全局标签栏实例，并配置刷新后的 sessionStorage 恢复策略 */
function getTabsView(resolve: (path: string) => RouteLocationResolved) {
  tabsViewInstance ??= useProTabsView({
    homePath: HOME_PATH,
    restore: {
      key: RESTORE_STORAGE_KEY,
      storage: 'session',
      resolve,
    },
  });
  return tabsViewInstance;
}

/** 读取刷新前标签记录的查询参数 */
function getRestoredQuery(path: string) {
  try {
    const queries = JSON.parse(
      window.sessionStorage.getItem(RESTORE_QUERY_STORAGE_KEY) || '{}'
    );
    return (queries as Record<string, Record<string, any>>)[path];
  } catch {
    return undefined;
  }
}

/** 标签变化时同步缓存各标签的查询参数 */
function saveRestoredQueries(tabs: UseTabsViewReturn['tabs']) {
  const queries: Record<string, Record<string, any>> = {};
  tabs.forEach(tab => {
    if (tab.query) queries[tab.path] = tab.query;
  });
  window.sessionStorage.setItem(
    RESTORE_QUERY_STORAGE_KEY,
    JSON.stringify(queries)
  );
}

/** 布局标签栏 hook 入口；syncRoute 仅由 BasicLayout 开启，业务页复用同一份状态 */
export function useTabsView(options?: { syncRoute?: boolean }) {
  const router = useRouter();
  const tabsView = getTabsView(path => {
    const query = getRestoredQuery(path);
    return router.resolve(query ? { path, query } : path);
  });

  if (options?.syncRoute) {
    watch(
      () => tabsView.tabs,
      tabs => saveRestoredQueries(tabs),
      {
        deep: true,
        immediate: true,
      }
    );
    watch(
      router.currentRoute,
      route => {
        const isHelperRoute = ['/login', '/register', '/403', '/404'].includes(
          route.path
        );
        if (!route.path.startsWith('/redirect') && !isHelperRoute) {
          tabsView.open(route);
        }
      },
      { immediate: true }
    );
  }

  /** 跳转到指定标签；已处于目标页面时不重复触发导航 */
  function navigateToTab(to: TabLocation | null) {
    if (!to) return;
    const current = router.currentRoute.value;
    if (current.fullPath === router.resolve(to).fullPath) return;
    router.push(to);
  }

  /** 点击标签时恢复该标签记录的查询参数并跳转 */
  function handleTabSelect(path: string) {
    navigateToTab(tabsView.goto(path));
  }

  /** 关闭指定标签；关闭最后一项时重新打开首页标签 */
  function handleTabClose(path: string) {
    const to = tabsView.close(path);
    if (!to) return;
    const current = router.currentRoute.value;
    if (current.fullPath === router.resolve(to).fullPath) {
      tabsView.open(current);
      return;
    }
    router.push(to);
  }

  /** 刷新指定标签；先移除 KeepAlive 缓存，再经过 redirect 路由重建页面 */
  function reloadTab(path: string) {
    const tab = tabsView.tabs.find(item => item.path === path);
    const route = router.currentRoute.value;
    const target = path === route.path ? route : undefined;
    if (target) {
      tabsView.cacheDelete(String(target.name || ''));
      router.replace({
        path: `/redirect${target.path}`,
        query: target.query,
      });
      return;
    }
    if (tab) tabsView.cacheDelete(tab.name);
  }

  /** 处理 TabsView 右侧操作菜单触发的标签动作 */
  function handleTabAction({ key, path }: TabsViewAction) {
    switch (key) {
      case 'reload':
        reloadTab(path);
        break;
      case 'closeCurrent':
        handleTabClose(path);
        break;
      case 'closeLeft':
        navigateToTab(tabsView.closeLeft(path));
        break;
      case 'closeRight':
        navigateToTab(tabsView.closeRight(path));
        break;
      case 'closeOther':
        navigateToTab(tabsView.closeOthers(path));
        break;
      case 'closeAll': {
        const to = tabsView.closeAll();
        if (router.currentRoute.value.path === to.path) {
          tabsView.open(router.currentRoute.value);
        } else {
          router.push(to);
        }
        break;
      }
    }
  }

  return {
    tabsView,
    closeTab: tabsView.close,
    handleTabSelect,
    handleTabClose,
    handleTabAction,
  };
}

/** 退出登录时清空内存标签与恢复缓存，避免标签信息跨账号泄漏 */
export function clearTabsView() {
  tabsViewInstance?.clear();
  if (tabsViewInstance) {
    tabsViewInstance.activePath = HOME_PATH;
  }
  window.sessionStorage.removeItem(RESTORE_STORAGE_KEY);
  window.sessionStorage.removeItem(RESTORE_QUERY_STORAGE_KEY);
}
