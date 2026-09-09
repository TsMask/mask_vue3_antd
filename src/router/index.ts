import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getAccessToken, getRefreshToken } from '@/plugins/auth-token';
import { ensureAccessToken, isSuccess } from '@/plugins/http-fetch';
import { validHttp } from '@/utils/regular-utils';
import useUserStore from '@/store/modules/user';
import useAppStore from '@/store/modules/app';
import useRouterStore from '@/store/modules/router';
import { constantRoutes } from './routes';

// NProgress Configuration
NProgress.configure({ showSpinner: false });

// 根据.env配置获取是否带井号和基础路径
const hasHash = import.meta.env.VITE_HISTORY_HASH;
const bashUrl = import.meta.env.VITE_HISTORY_BASE_URL;
const historyType =
  hasHash === 'true'
    ? createWebHashHistory(bashUrl)
    : createWebHistory(bashUrl);

/** 全局路由 */
const router = createRouter({
  history: historyType,
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

/** 无Token可访问页面地址白名单 */
const WHITE_LIST: string[] = [
  '/login',
  '/redirect',
  '/404',
  '/403',
  '/register',
  '/forgot-password',
];

/** 全局路由-后置守卫 */
router.afterEach((to, from, failure) => {
  NProgress.done();
  // 设置标题
  if (to.meta?.title) {
    useAppStore().setTitle(to.meta.title);
  }
});

/**
 * 全局路由-前置守卫
 *
 * 核心流程：
 * 1. 无 token → 白名单放行，否则重定向到登录页
 * 2. 有 token + 访问登录页 → 重定向到首页
 * 3. 有 token + 已有角色信息 → 放行
 * 4. 有 token + 无角色信息 → 请求用户信息 + 动态路由 → 放行或跳转登录
 */
router.beforeEach(async (to, from) => {
  NProgress.start();
  let accessToken = getAccessToken();

  // access cookie 过期后，先用 refresh token 恢复登录态，再进入路由初始化。
  if (!accessToken && getRefreshToken()) {
    const refreshResult = await ensureAccessToken();
    if (isSuccess(refreshResult)) accessToken = getAccessToken();
  }

  // 没有token
  if (!accessToken) {
    if (WHITE_LIST.includes(to.path)) {
      // 在免登录白名单，直接进入
      return;
    } else {
      // 否则全部重定向到登录页
      return `/login?redirect=${encodeURIComponent(to.fullPath)}`;
    }
  }

  // 有Token
  if (accessToken) {
    // 防止重复访问登录页面
    if (to.path === '/login') {
      return { name: 'Index' };
    } else if (WHITE_LIST.includes(to.path)) {
      // 在免登录白名单，直接进入
      return;
    } else {
      // 判断当前用户是否有角色信息
      const user = useUserStore();
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        return;
      }
      try {
        // 获取用户信息（失败时会 throw，由下方 catch 处理）
        await user.fnGetInfo();
        // 获取路由信息
        const accessRoutes = await useRouterStore().generateRoutes();
        // 根据后台配置生成可访问的路由表
        if (accessRoutes && accessRoutes.length !== 0) {
          for (const route of accessRoutes) {
            // 动态添加可访问路由表，http开头会异常
            if (!validHttp(route.path)) {
              router.addRoute(route);
            }
          }
        }
        // 刷新替换原先路由，确保addRoutes已完成
        return { ...to, replace: true };
      } catch (error: any) {
        console.error(`[Router Guard] ${to.path}: ${error.message}`);
        // 这里可能是网络异常，不调用后端注销；统一走本地会话清理并保留回跳地址。
        const { endAuthSession } = await import('@/plugins/auth-session');
        await endAuthSession({ redirect: to.fullPath });
        return { name: 'Login' };
      }
    }
  }
});

export default router;
