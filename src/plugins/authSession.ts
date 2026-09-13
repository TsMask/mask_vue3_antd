import { logout as logoutApi } from '@/api/auth';
import { delAccessToken, delRefreshToken } from '@/plugins/authToken';
import { CACHE_SESSION_FETCH } from '@/constants/cacheKeys';
import { sessionRemove } from '@/utils/cacheSession';
import { clearTabsView } from '@/layouts/hooks/useTabsView';
import useDictStore from '@/store/modules/dict';
import useUserStore from '@/store/modules/user';
import router from '@/router';

type EndAuthSessionOptions = {
  /** 主动退出时先通知后端撤销会话；认证已失效时不再次调用注销接口。 */
  notifyServer?: boolean;
  /** 需要在重新登录后恢复的页面地址。 */
  redirect?: string;
};

let endingSessionPromise: Promise<void> | null = null;

/** 生成本地会话无关的登录页地址；整页跳转用于彻底重建 Pinia 与动态路由。 */
function createLoginHref(redirect?: string) {
  return router.resolve({
    path: '/login',
    query: redirect ? { redirect } : undefined,
  }).href;
}

/** 清理所有随登录账号变化的内存状态，全局配置类状态保持不变。 */
function resetAuthSession() {
  delAccessToken();
  delRefreshToken();
  clearTabsView();
  sessionRemove(CACHE_SESSION_FETCH);

  useUserStore().$reset();
  useDictStore().clearDict();
}

/** 统一结束认证会话；并发触发时共用同一次清理和跳转。 */
export async function endAuthSession(options: EndAuthSessionOptions = {}) {
  if (endingSessionPromise) return endingSessionPromise;

  const loginHref = createLoginHref(options.redirect);
  endingSessionPromise = (async () => {
    try {
      if (options.notifyServer) await logoutApi();
    } finally {
      resetAuthSession();
      window.location.replace(loginHref);
    }
  })().finally(() => {
    endingSessionPromise = null;
  });

  return endingSessionPromise;
}

/** 用户主动退出：先撤销服务端会话，无论接口结果如何都完成本地退出。 */
export function logoutAuthSession() {
  return endAuthSession({ notifyServer: true });
}

/** 认证失效后的被动退出：保留当前页面供重新登录后回来。 */
export function forceAuthLogout() {
  return endAuthSession({
    redirect: router.currentRoute.value.fullPath,
  });
}
