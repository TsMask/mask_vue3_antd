import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { isNavigationFailure, Router } from 'vue-router';
import { getToken } from '@/plugins/AuthToken';
import { validHttp } from '@/utils/RegularUtils';
import useUserStore from '@/store/modules/user';
import useAppStore from '@/store/modules/app';
import useRouterStore from '@/store/modules/router';

// NProgress Configuration
NProgress.configure({ showSpinner: false });

/**无Token可访问页面地址白名单 */
const WHITE_LIST: string[] = ['/login', '/auth-redirect', '/bind', '/register'];

/**
 * 路由守卫
 *
 * @author TsMask
 */
export default class Guard {
  private router: Router;

  constructor(router: Router) {
    this.router = router;
    this.beforeEach();
    this.afterEach();
    return this;
  }

  /**获取守卫路由 */
  public getRouter(): Router {
    return this.router;
  }

  /**全局前置守卫 */
  private beforeEach() {
    this.router.beforeEach((to, from, next) => {
      NProgress.start();
      // 设置标题
      if (to.meta?.title) {
        useAppStore().setTitle(to.meta.title);
      }
      const token = getToken();

      // 没有token
      if (!token) {
        if (WHITE_LIST.includes(to.path)) {
          // 在免登录白名单，直接进入
          next();
        } else {
          // 否则全部重定向到登录页
          next(`/login?redirect=${to.fullPath}`);
        }
      }

      // 有Token
      if (token) {
        // 防止重复访问登录页面
        if (to.path === '/login') {
          next({ name: 'Index' });
        } else {
          // 判断当前用户是否有角色信息
          const user = useUserStore();
          if (user.roles && user.roles.length === 0) {
            // 获取用户信息
            user
              .fnGetInfo()
              .then(() => {
                return useRouterStore().generateRoutes();
              })
              .then(accessRoutes => {
                // 根据后台配置生成可访问的路由表
                if (accessRoutes && accessRoutes.length !== 0) {
                  for (const route of accessRoutes) {
                    // 动态添加可访问路由表，http开头会异常
                    if (!validHttp(route.path)) {
                      this.router.addRoute(route);
                    }
                  }
                }
                // 刷新替换原先路由，确保addRoutes已完成
                next({ ...to, replace: true });
              })
              .catch(e => {
                console.error('路由守卫异常 ', e);
                user.fnLogOut().finally(() => {
                  next({ name: 'Index' });
                });
              });
          } else {
            next();
          }
        }
      }
    });
  }

  /**全局后置守卫 */
  private afterEach() {
    this.router.afterEach((to, from, failure) => {
      NProgress.done();

      // 失败原因
      if (isNavigationFailure(failure)) {
        console.error('failed navigation', failure);
      }
    });
  }
}
