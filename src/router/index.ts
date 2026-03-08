import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getAccessToken } from '@/plugins/auth-token';
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

/**全局路由 */
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

/**无Token可访问页面地址白名单 */
const WHITE_LIST: string[] = [
  '/login',
  '/redirect',
  '/404',
  '/403',
  '/register',
];

/**全局路由-后置守卫 */
router.afterEach((to, from, failure) => {
  NProgress.done();
  // 设置标题
  if (to.meta?.title) {
    useAppStore().setTitle(to.meta.title);
  }
});

/**全局路由-前置守卫 */
router.beforeEach(async (to, from) => {
  NProgress.start();
  const accessToken = getAccessToken();

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
        // 获取用户信息
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
        console.error(`[${to.path}]: ${error.message}`);
        await user.fnLogOut();
        return { name: 'Login' };
      }
    }
  }
});

export default router;
