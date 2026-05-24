import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import type { App } from 'vue';

/**
 * 创建 QueryClient 实例
 *
 * 全局默认配置：
 * - refetchOnWindowFocus: false  管理后台切换tab时不自动刷新，避免打断用户操作
 * - retry: 1                     网络错误最多重试1次，避免频繁请求
 * - staleTime: 30_000            数据30秒内视为新鲜，减少不必要的重复请求
 * - gcTime: 5 * 60_000           缓存数据5分钟后清理（原cacheTime）
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** 窗口聚焦时不自动重新请求 */
      refetchOnWindowFocus: false,
      /** 网络失败重试次数 */
      retry: 1,
      /** 数据新鲜时间（毫秒），此期间内不会重新请求 */
      staleTime: 30_000,
      /** 缓存垃圾回收时间（毫秒） */
      gcTime: 5 * 60_000,
    },
    mutations: {
      /** mutation 失败不重试 */
      retry: 0,
    },
  },
});

/**
 * Vue Query 插件（已绑定 queryClient）
 *
 * 在 main.ts 中只需：
 *   import { VueQuery } from '@/plugins/vue-query';
 *   app.use(VueQuery);
 */
export const VueQuery = {
  install(app: App) {
    app.use(VueQueryPlugin, { queryClient });
  },
};