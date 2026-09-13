<script setup lang="ts">
import {
  ProLayout,
  GlobalFooter,
  TabsView,
} from 'antdv-pro-layout';
import type { MenuDataItem } from 'antdv-pro-layout';
import RightContent from './components/RightContent.vue';
import { useTabsView } from './hooks/useTabsView';
import { scriptUrl } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { computed, reactive, watch } from 'vue';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
import { useLayoutSettings } from '@/layouts/hooks/useLayoutSettings';
import { useRouter } from 'vue-router';
const { appName } = useAppStore();
const { proConfig } = useLayoutSettings();
const userStore = useUserStore();
const HOME_ROUTE_NAME = 'HomeIndex';
const router = useRouter();
const { tabsView, handleTabSelect, handleTabClose, handleTabAction } =
  useTabsView({ syncRoute: true });

type BreadcrumbRoute = {
  path: string;
  breadcrumbName?: string;
};

/** 水印由当前登录用户派生，用户 Store 不反向修改布局状态。 */
const waterMarkContent = computed(() => {
  if (!userStore.user_nick) return appName;
  return userStore.user_phone
    ? `${userStore.user_nick} ${userStore.user_phone}`
    : userStore.user_nick;
});

/**菜单面板 */
const layoutState = reactive({
  collapsed: false, // 是否展开菜单面板
  openKeys: ['/'], // 打开菜单key
  selectedKeys: ['/index'], // 选中高亮菜单key
});

function isPathPrefix(menuPath: string, routePath: string) {
  if (menuPath === routePath) return true;
  return routePath.startsWith(
    menuPath.endsWith('/') ? menuPath : `${menuPath}/`
  );
}

function findNavigationTrail(
  menus: MenuDataItem[],
  routePath: string,
  parentTrail: MenuDataItem[] = []
): MenuDataItem[] | undefined {
  for (const menu of menus) {
    const trail = [...parentTrail, menu];
    if (menu.path === routePath) return trail;

    if (isPathPrefix(menu.path, routePath)) {
      return (
        findNavigationTrail(menu.children ?? [], routePath, trail) ?? trail
      );
    }
  }
  return undefined;
}

/** 侧边栏直接消费语义菜单，不再从 vue-router 记录反推。 */
const navigationMenus = computed(() => {
  const rootRoute = router.currentRoute.value.matched.find(
    route => route.path === '/'
  );
  return rootRoute?.meta.navigation ?? [];
});

const navigationTrail = computed(() =>
  findNavigationTrail(navigationMenus.value, router.currentRoute.value.path)
);

/**监听路由变化改变菜单面板选项；隐藏内嵌页高亮其上级可见页面。 */
watch(
  router.currentRoute,
  v => {
    const trail = findNavigationTrail(navigationMenus.value, v.path) ?? [];
    layoutState.openKeys = trail.slice(0, -1).map(item => item.path);
    layoutState.selectedKeys = trail.at(-1)
      ? [trail[trail.length - 1].path]
      : [];
  },
  { immediate: true }
);

/**面包屑数据对象，排除根节点和首页不显示 */
const breadcrumb = computed<BreadcrumbRoute[]>(() => {
  const route = router.currentRoute.value;
  const trail = navigationTrail.value ?? [];
  const items = trail
    .filter(item => item.path !== '/index')
    .map(item => ({
      path: item.path,
      breadcrumbName: item.meta?.title || '-',
    }));
  const last = items[items.length - 1];

  if (
    (!last || last.path !== route.path) &&
    route.path !== '/index' &&
    route.path !== '/'
  ) {
    items.push({
      path: route.path,
      breadcrumbName: route.meta.title || '-',
    });
  }
  return items;
});

</script>

<template>
  <a-watermark :content="waterMarkContent" :z-index="100">
    <ProLayout
      v-model:collapsed="layoutState.collapsed"
      v-model:selectedKeys="layoutState.selectedKeys"
      v-model:openKeys="layoutState.openKeys"
      :menu-data="navigationMenus"
      :breadcrumb="{ routes: breadcrumb }"
      v-bind="proConfig"
      :iconfont-url="scriptUrl"
    >
      <!--插槽-菜单头-->
      <template #menuHeaderRender>
        <RouterLink :to="{ name: HOME_ROUTE_NAME }" :replace="true">
          <img class="app-logo" src="@/assets/logo.png" />
          <h1>{{ appName }}</h1>
        </RouterLink>
      </template>

      <!--插槽-渲染顶部内容右端区域-->
      <template #headerContentRightRender>
        <RightContent />
      </template>

      <!--插槽-导航标签项-->
      <template #tabRender="{ width, fixedHeader, headerRender }">
        <TabsView
          v-model:activeKey="tabsView.activePath"
          :tabs="tabsView.tabs"
          :home-path="tabsView.homePath"
          :iconfont-url="scriptUrl"
          :height="36"
          :width="width"
          :fixed-header="fixedHeader"
          :header-render="headerRender"
          @select="handleTabSelect"
          @close="handleTabClose"
          @action="handleTabAction"
        />
      </template>

      <!--插槽-页面路由导航面包屑-->
      <template #breadcrumbRender="{ route, params, routes }">
        <span v-if="routes.indexOf(route) === routes.length - 1">
          {{ route.breadcrumbName }}
        </span>
        <RouterLink v-else :to="{ path: route.path, params }">
          {{ route.breadcrumbName }}
        </RouterLink>
      </template>

      <!--内容页面视图-->
      <RouterView v-slot="{ Component, route }">
        <transition name="slide-left" mode="out-in">
          <KeepAlive :include="tabsView.caches">
            <component :is="Component" :key="route.path" />
          </KeepAlive>
        </transition>
      </RouterView>

      <!--插槽-内容底部-->
      <template #footerRender>
        <GlobalFooter
          :links="[
            {
              blankTarget: true,
              title: '开发手册',
              href: 'https://juejin.cn/column/7188761626017792056',
            },
            {
              blankTarget: true,
              title: '开源仓库',
              href: 'https://gitee.com/TsMask/',
            },
            {
              blankTarget: true,
              title: '接口文档',
              href: 'https://mask-api-midwayjs.apifox.cn/',
            },
          ]"
          copyright="Copyright © 2023-2026 Gitee For TsMask"
        >
        </GlobalFooter>
      </template>
    </ProLayout>
  </a-watermark>
</template>

<style scoped>
.app-logo {
  height: 32px;
  vertical-align: middle;
  border-style: none;
  border-radius: 6.66px;
}
</style>
