import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type Router,
} from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getAccessToken, getRefreshToken } from '@/plugins/authToken';
import { ensureAccessToken, isSuccess } from '@/plugins/httpFetch';
import useUserStore from '@/store/modules/user';
import useAppStore from '@/store/modules/app';
import { HOME_PATH } from '@/constants/router';
import { staticRoutes } from './staticRoutes';
import { createAccessRoutes } from './dynamicRoutes';

const WHITE_LIST = new Set([
  '/login',
  '/redirect',
  '/404',
  '/403',
  '/register',
  '/forgot-password',
]);

function createLoginLocation(redirect: string) {
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

async function resolveAccessToken() {
  const accessToken = getAccessToken();
  if (accessToken || !getRefreshToken()) return accessToken;

  const refreshResult = await ensureAccessToken();
  return isSuccess(refreshResult) ? getAccessToken() : undefined;
}

function hasUserInfo() {
  const roles = useUserStore().roles;
  return Array.isArray(roles) && roles.length > 0;
}

function setupRouterGuards(router: Router) {
  NProgress.configure({ showSpinner: false });
  const accessRoutes = createAccessRoutes(router);

  router.afterEach(to => {
    NProgress.done();
    if (to.meta?.title) useAppStore().setTitle(to.meta.title);
  });

  router.beforeEach(async to => {
    NProgress.start();
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return WHITE_LIST.has(to.path)
        ? undefined
        : createLoginLocation(to.fullPath);
    }

    if (to.path === '/login') return { path: HOME_PATH };
    if (WHITE_LIST.has(to.path)) return undefined;
    if (hasUserInfo() && accessRoutes.isReady()) return undefined;

    try {
      if (!hasUserInfo()) await useUserStore().fnGetInfo();
      await accessRoutes.install();
      return { ...to, replace: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Router Guard] ${to.path}: ${message}`);

      const { endAuthSession } = await import('@/plugins/authSession');
      await endAuthSession({ redirect: to.fullPath });
      return { path: '/login' };
    }
  });
}

const history =
  import.meta.env.VITE_HISTORY_HASH === 'true'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL);

const router = createRouter({
  history,
  routes: staticRoutes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

setupRouterGuards(router);

export default router;
