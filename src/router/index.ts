import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
  RouteLocationRaw,
  isNavigationFailure,
  RouteLocationNormalized,
} from 'vue-router';
import BasicLayout from '../layouts/BasicLayout.vue';
import NestedLayout from '../layouts/NestedLayout.vue';
import BlankLayout from '../layouts/BlankLayout.vue';
import WelcomePage from '../views/Page1.vue';
import getRouters from './getRouter.json';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false }); // NProgress Configuration
const whiteList = ['Login', 'Register'];
function toLogin(to: RouteLocationNormalized): RouteLocationRaw {
  return {
    name: 'Login',
    query: {
      redirect: to.name as string,
      ...to.query,
    },
  };
}

let asyncRoutes = []; //定义数组接收后端返回的路由

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue');

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(
  asyncRouterMap: any[],
  lastRouter = false,
  type = true
) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children);
    }
    console.log(route);
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'BasicLayout') {
        route.component = BasicLayout;
      } else if (route.component === 'ParentView') {
        route.component = BlankLayout;
      } else if (route.component === 'InnerLink') {
        route.component = BlankLayout;
      } else {
        route.component = loadView(route.component);
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type);
    } else {
      // route.children = ()=>{};
      delete route['children'];
      delete route['redirect'];
    }
    return true;
  });
}

function filterChildren(childrenMap: any[], lastRouter = false) {
  var children: any[] = [];
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach((c: any) => {
          c.path = el.path + '/' + c.path;
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c));
            return;
          }
          children.push(c);
        });
        return;
      }
    }
    if (lastRouter && typeof lastRouter === 'object') {
      el.path = lastRouter['path'] + '/' + el.path;
    }
    children = children.concat(el);
  });
  return children;
}

export const loadView = (view: string) => {
  let res;
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0];
    if (dir === view) {
      res = () => modules[path]();
    }
  }
  return res;
};

// 根据.env配置获取是否带井号和基础路径
const hasHash = import.meta.env.VITE_HISTORY_HASH;
const bashUrl = import.meta.env.VITE_HISTORY_BASE_URL;
// https://ant.design/components/icon
// mate数据类型
// https://github.com/vueComponent/pro-components/blob/a19279f3a28190bf11e8c36f316c92dbd3387a6d/packages/pro-layout/src/typings.ts#L16
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    meta: { title: 'Home' },
    component: BasicLayout,
    redirect: '/welcome',
    children: [
      {
        path: '/welcome',
        name: 'welcome',
        meta: { title: '欢迎', icon: 'icon-pcduan' },
        component: WelcomePage,
      },
      {
        path: '/admins',
        name: 'admins',
        meta: {
          title: '管理页',
          icon: 'icon-tuijian',
          hideChildInMenu: false,
          flatMenu: true,
        },
        component: BlankLayout,
        redirect: () => ({ name: 'page1' }),
        children: [
          {
            path: 'page-1',
            name: 'page1',
            meta: { title: '一级页面', icon: 'icon-icon-test' },
            component: () => import('../views/admins/PageInfo.vue'),
          },
          {
            path: 'page-2',
            name: 'page2',
            meta: { title: '二级页面', icon: 'icon-huizhiguize' },
            component: () => import('../views/admins/PageTypography.vue'),
          },
          {
            path: 'dynamic-match/:id(\\d+)',
            name: 'dynamic-match',
            // 路由 path 默认参数再 meta.params 里
            meta: { title: '动态参数页面', params: { id: 1 } },
            component: () => import('../views/admins/DynamicMatch.vue'),
          },
          {
            path: 'ds-2',
            name: 'ds2',
            meta: { title: 'ds2', type: 'group' },
            component: () => import('../views/admins/PageTypography.vue'),
          },
          {
            path: 'ds',
            name: 'ds',
            // 路由 path 默认参数再 meta.params 里
            meta: { title: 'ds', disabled: true },
            component: () => import('../views/admins/DynamicMatch.vue'),
          },
        ],
      },
      {
        path: '/login',
        name: 'Login',
        meta: { title: 'Login', icon: 'icon-antdesign' },
        component: () => import('../views/Detail.vue'),
      },
      {
        path: 'https://baidu.com/',
        name: 'baidu_target',
        meta: { title: 'Baidu', icon: 'icon-twitter', target: '_blank' },
        component: () => {},
      },
    ],
  },
];

const donstantRoutes: RouteRecordRaw[] = [
  {
    path: '/sys',
    name: 'sys',
    meta: { title: 'sys' },
    component: BasicLayout,
    redirect: '/s1',
    children: [
      {
        path: '/s1',
        name: 's1',
        meta: { title: 's1', icon: 'icon-pcduan' },
        component: WelcomePage,
      },
      {
        path: '/s2',
        name: 's2',
        meta: { title: 's2', icon: 'icon-antdesign' },
        component: () => import('../views/Detail.vue'),
      },
      {
        path: 'https://baidu.com/',
        name: 's3_www',
        meta: { title: 's3_www', icon: 'icon-twitter', target: '_blank' },
        component: () => {},
      },
    ],
  },
];

function getTree(list: any[], pid = 0, pidPath = '') {
  return list
    .filter(item => item.pid === pid)
    .map((item): any => {
      const url = item.url.startsWith('/') ? item.url : '/' + item.url;

      const component =
        pid === 0 ? BasicLayout : modules[`../views${pidPath + url}/index.vue`];

      const pidRouterPath = pid === 0 ? url : pidPath + url;

      return {
        path: pidRouterPath,
        name: pidRouterPath?.slice(1),
        pidRouterPath,
        component,
        meta: {
          title: item.name, // 菜单名
          icon: item.icon, // 菜单的icon
          hidden: item.type === 2 ? true : false, // 是否隐藏
          isDynamic: true, // 是动态路由
        },
        children: item.type === 1 ? [] : getTree(list, item.id, pidRouterPath),
      };
    });
}

console.log(getRouters);

const router = createRouter({
  history:
    hasHash === 'true'
      ? createWebHashHistory(bashUrl)
      : createWebHistory(bashUrl),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

const isLogin = false;
  const userStore = {
    token: true,
    roles: [],
    info: async () => {},
    logout: async () => {},
  };

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  // next();
  
  if (userStore.token) {
    console.log(userStore.roles, userStore.roles.length);
    if (userStore.roles && userStore.roles.length > 0) {
      next();
    } else {
      try {
        await userStore.info();
        console.log(to.name);
        // 根据roles权限生成可访问的路由表
        // 动态添加可访问路由表
        const res = filterAsyncRouter(getRouters.data);
        console.log(res)
        constantRoutes[0].children = constantRoutes[0].children?.concat(res)
       console.log(constantRoutes)
        // const routeList = getTree(getRouters.data)
        // const newMenuList = [...constantRoutes, ...routeList]
        constantRoutes.forEach((item) => {
          router.addRoute(item)
        })
        userStore.roles.push(1)
        // donstantRoutes.forEach(route => router.addRoute(route) );
        // await router.replace(to);
        // next({ ...to, replace: true }) // hack方法 确保addRoutes已完成

        next();
      } catch (error) {
        await userStore.logout();
        toLogin(to);
      }
    }
  } else {
    if (whiteList.includes(to.name as string)) {
      next();
      return;
    } else {
      toLogin(to);
    }
  }
});

router.afterEach((to, from, failure) => {
  NProgress.done();
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure);
  }
});
export default router;
