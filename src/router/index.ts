import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router';
import BasicLayout from '../layouts/BasicLayout.vue';
import BlankLayout from '../layouts/BlankLayout.vue';
import WelcomePage from '../views/Page1.vue';
import RouterGuard from './RouterGuard';

// import { MetaRecord, MenuDataItem } from '@ant-design-vue/pro-layout';
// mate数据类型 MetaRecord
// 根据/路径构建菜单列表，列表项类型 MenuDataItem
// https://github.com/vueComponent/pro-components/blob/a19279f3a28190bf11e8c36f316c92dbd3387a6d/packages/pro-layout/src/typings.ts#L16
// 菜单图标来源 https://ant.design/components/icon

/**公共路由 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/redirect',
    component: BasicLayout,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    meta: { title: '登录' },
    component: () => import('@/views/login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    meta: { title: '注册' },
    component: () => import('@/views/register.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    meta: { title: '找不到匹配页面' },
    component: () => import('@/views/error/404.vue'),
  },
  {
    path: '/401',
    name: 'NotPermission',
    meta: { title: '没有权限访问' },
    component: () => import('@/views/error/401.vue'),
  },
  {
    path: '/',
    name: 'Root',
    meta: { title: '根节点' },
    component: BasicLayout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        name: 'Index',
        meta: { title: '首页', icon: 'icon-pcduan' },
        component: () => import('@/views/index.vue'),
      },
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
          icon: 'icon-huizhiguize',
          hideChildInMenu: false,
          flatMenu: false,
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
        path: 'https://baidu.com/',
        name: 'baidu_target',
        meta: { title: 'Baidu', icon: 'icon-twitter', target: '_blank' },
        component: () => {},
      },
    ],
  },
  {
    path: '/user',
    component: BasicLayout,
    redirect: () => ({ name: 'Profile' }),
    children: [
      {
        path: 'profile',
        name: 'Profile',
        meta: { title: '个人中心' },
        component: () => import('@/views/system/user/profile/index.vue'),
      },
    ],
  },
];

// 根据.env配置获取是否带井号和基础路径
const hasHash = import.meta.env.VITE_HISTORY_HASH;
const bashUrl = import.meta.env.VITE_HISTORY_BASE_URL;

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

export default new RouterGuard(router).getRouter();
