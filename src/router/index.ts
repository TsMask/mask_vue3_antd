import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router';
import { encode } from 'js-base64';
import BasicLayout from '../layouts/BasicLayout.vue';
import BlankLayout from '../layouts/BlankLayout.vue';
import LinkLayout from '../layouts/LinkLayout.vue';
import Guard from './Guard';

// import { MetaRecord, MenuDataItem } from '@ant-design-vue/pro-layout';
// mate数据类型 MetaRecord
// 根据/路径构建菜单列表，列表项类型 MenuDataItem
// https://github.com/vueComponent/pro-components/blob/a19279f3a28190bf11e8c36f316c92dbd3387a6d/packages/pro-layout/src/typings.ts#L16
// 菜单图标来源 https://ant.design/components/icon 自定义iconfont

/**公共路由 */
const constantRoutes: RouteRecordRaw[] = [
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
        path: '/dome1',
        name: 'dome1',
        meta: { title: '示例一', icon: 'icon-ios' },
        component: () => import('@/views/dome/dome1.vue'),
      },
      {
        path: '/dome2',
        name: 'dome2',
        meta: { title: '示例二', icon: 'icon-anzhuo' },
        component: () => import('@/views/dome/dome2.vue'),
      },
      {
        path: '/dome3',
        name: 'dome3',
        meta: { title: '示例三', icon: 'icon-qunzhu' },
        component: () => import('@/views/dome/dome3.vue'),
      },
      {
        path: '/domes',
        name: 'Domes',
        meta: {
          title: '示例目录',
          icon: 'icon-zhizuoliucheng',
        },
        component: BlankLayout,
        redirect: () => ({ name: 'PageInfo' }),
        children: [
          {
            path: 'page-info',
            name: 'PageInfo',
            meta: { title: '页面信息', icon: 'icon-huifu' },
            component: () => import('../views/domes/PageInfo.vue'),
          },
          {
            path: 'page-typography',
            name: 'PageTypography',
            meta: { title: '文本信息', icon: 'icon-huizhiguize' },
            component: () => import('../views/domes/PageTypography.vue'),
          },
          {
            path: 'dynamic-match/:id(\\d+)',
            name: 'DynamicMatch',
            // 路由 path 默认参数再 meta.params 里
            meta: { title: '动态参数页面', params: { id: 1 } },
            component: () => import('../views/domes/DynamicMatch.vue'),
          },
          {
            path: 'disabled',
            name: 'Disabled',
            meta: { title: '禁止点击', disabled: true },
            component: () => import('../views/domes/PageInfo.vue'),
          },
          {
            path: 'https://github.com/TsMask',
            name: 'BlankGithubTsMask',
            meta: {
              title: 'TsMask-打开新窗',
              icon: 'icon-github',
              target: '_blank',
            },
            component: () => {},
          },
          {
            path: encode('https://www.antdv.com/components/comment-cn'),
            name: 'HttpsAntDesignVue',
            meta: {
              title: 'Antdv-内嵌窗口',
              icon: 'icon-morentouxiang',
              target: null,
            },
            component: LinkLayout,
          },
        ],
      },
      {
        path: 'https://github.com/',
        name: 'BlankGithub',
        meta: {
          title: 'Github-打开新窗',
          icon: 'icon-github',
          target: '_blank',
        },
        component: () => {},
      },
      {
        path: 'https://www.antdv.com/components/comment-cn?sdf=12321&id=12&sdnf',
        name: 'SelfAnt Design Vue',
        meta: {
          title: 'Antdv-当前窗口',
          icon: 'icon-morentouxiang',
          target: '_self',
        },
        component: LinkLayout,
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
    path: '/403',
    name: 'NotPermission',
    meta: { title: '没有访问权限' },
    component: () => import('@/views/error/403.vue'),
  },
  {
    path: '/redirect',
    name: 'Redirect',
    meta: { title: '重定向' },
    component: BasicLayout,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    meta: { title: '找不到匹配页面' },
    component: () => import('@/views/error/404.vue'),
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

export default new Guard(router).getRouter();
