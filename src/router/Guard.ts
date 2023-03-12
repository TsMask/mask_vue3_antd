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

/**
 * 路由守卫
 *
 * @author TsMask
 */
export default class Guard {
  private router: Router;

  /**无Token可访问页面地址白名单 */
  private whiteList: string[] = [
    '/login',
    '/auth-redirect',
    '/bind',
    '/register',
  ];

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
    this.router.beforeEach(async (to, from, next) => {
      NProgress.start();

      // 有Token
      if (getToken()) {
        // 设置标题
        if (to.meta.title) {
          useAppStore().setTitle(to.meta.title);
        }
        // 防止重复登录
        if (to.path === '/login') {
          next({ name: 'Index' });
        } else {
          const user = useUserStore();
          // 判断当前用户是否有角色信息
          if (user.roles && user.roles.length === 0) {
            try {
              // 获取用户信息
              await user.fnGetInfo();
              // 根据后台配置生成可访问的路由表
              const accessRoutes = await useRouterStore().generateRoutes();
              if (accessRoutes && accessRoutes.length !== 0) {
                for (const route of accessRoutes) {
                  // 动态添加可访问路由表，http开头会异常
                  if (!validHttp(route.path)) {
                    this.router.addRoute(route);
                  }
                }
              }
              next({ ...to, replace: true }); // hack方法 确保addRoutes已完成
            } catch (e) {
              console.error('路由添加异常 ', e);
              await user.fnLogOut();
              next({ name: 'Index' });
            }
          } else {
            next();
          }
        }
      } else {
        // 没有token
        if (this.whiteList.includes(to.path)) {
          // 在免登录白名单，直接进入
          next();
        } else {
          // 否则全部重定向到登录页
          next(`/login?redirect=${to.fullPath}`);
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
