import { createVNode } from 'vue';
import { AlipayOutlined } from '@ant-design/icons-vue';
import { encode } from 'js-base64';
import BasicLayout from '../layouts/BasicLayout.vue';
import BlankLayout from '../layouts/BlankLayout.vue';
import LinkLayout from '../layouts/LinkLayout.vue';
import type { RouteRecordRaw } from 'vue-router';

// import { MetaRecord, MenuDataItem } from 'antdv-pro-layout';
// 根据/路径构建菜单列表，
// 菜单数据项类型 MenuDataItem
// 菜单数据项元数据类型 MetaRecord
// https://gitee.com/TsMask/antdv-pro-layout/blob/main/src/utils/index.ts
// 菜单图标来源 https://ant.design/components/icon 自定义iconfont

/**公共路由 */
export const constantRoutes: RouteRecordRaw[] = [
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
        meta: { title: '首页', icon: 'icon-pcduan', cache: true },
        component: () => import('@/views/home/index.vue'),
      },
      {
        path: '/demo1',
        name: 'Demo1',
        meta: { title: '示例一', icon: 'icon-ios' },
        component: () => import('@/views/demo/demo1.vue'),
      },
      {
        path: '/demo2',
        name: 'Demo2',
        meta: { title: '示例二', icon: 'icon-anzhuo' },
        component: () => import('@/views/demo/demo2.vue'),
      },
      {
        path: '/demo3',
        name: 'Demo3',
        meta: { title: '示例三', icon: createVNode(AlipayOutlined) },
        component: () => import('@/views/demo/demo3.vue'),
      },
      {
        path: '/demos',
        name: 'Demos',
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
            component: () => import('@/views/demos/page-info.vue'),
          },
          {
            path: 'page-typography',
            name: 'PageTypography',
            meta: { title: '文本信息', icon: 'icon-huizhiguize' },
            component: () => import('@/views/demos/page-typography.vue'),
          },
          {
            path: 'dynamic-match/:id(\\d+)',
            name: 'DynamicMatch',
            // 路由 path 默认参数再 meta.params 里
            meta: { title: '动态参数页面', params: { id: 1 }, cache: true },
            component: () => import('@/views/demos/dynamic-match.vue'),
          },
          {
            path: 'disabled',
            name: 'Disabled',
            meta: { title: '禁止点击', disabled: true },
            component: () => {},
          },
          {
            path: 'danger',
            name: 'Danger',
            meta: { title: '危险警告', danger: true },
            component: () => import('@/views/demo/demo3.vue'),
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
              target: undefined,
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
        path: 'https://www.antdv.com/',
        name: 'Ant Design Vue',
        meta: {
          title: 'Antdv-当前窗口',
          icon: 'icon-morentouxiang',
          target: '_self',
        },
        component: LinkLayout,
      },
      {
        path: '/account',
        name: 'Account',
        meta: {
          title: '个人中心',
        },
        component: BlankLayout,
        redirect: '/account/profile',
        children: [
          {
            path: 'profile',
            name: 'Profile',
            meta: { title: '个人信息', cache: true },
            component: () => import('@/views/account/profile.vue'),
          },
          {
            path: 'settings',
            name: 'Settings',
            meta: { title: '个人设置', cache: true },
            component: () => import('@/views/account/settings.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    meta: { title: '登录' },
    component: () => import('@/views/login/index.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    meta: { title: '注册' },
    component: () => import('@/views/register/index.vue'),
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
