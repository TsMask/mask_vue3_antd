<script setup lang="ts">
import RightContent from './components/RightContent.vue';
import LayoutSetting from './components/LayoutSetting.vue';
import {
  WaterMark,
  getMenuData,
  clearMenuItem,
  RouteContextProps,
} from '@ant-design-vue/pro-layout';
import { TagsOutlined, TagOutlined } from '@ant-design/icons-vue';
import { computed, reactive, watch } from 'vue';
import useLayoutStore from '@/store/modules/layout';
import useAppStore from '@/store/modules/app';
import useRouterStore from '@/store/modules/router';
import { useRouter } from 'vue-router';
const { buildRouterData } = useRouterStore();
const { proConfig, waterMarkContent } = useLayoutStore();
const { systemName } = useAppStore();
const router = useRouter();

// 菜单面板
const state = reactive<Omit<RouteContextProps, 'menuData'>>({
  collapsed: false, // default collapsed
  openKeys: [], // default openKeys
  selectedKeys: [], // default selectedKeys
});

// 监听路由变化改变菜单面板选项
watch(
  router.currentRoute,
  v => {
    const matched = v.matched.concat();
    state.openKeys = matched.filter(r => r.path !== v.path).map(r => r.path);
    state.selectedKeys = matched
      .filter(r => r.name !== 'Root')
      .map(r => r.path);
  },
  { immediate: true }
);

// 动态路由添加到菜单面板
if (buildRouterData && buildRouterData.length > 0) {
  const rootRoute = router.getRoutes().find(item => item.name === 'Root');
  if (rootRoute) {
    rootRoute.children = [
      ...new Set(rootRoute.children.concat(buildRouterData)),
    ];
  }
}
const { menuData } = getMenuData(clearMenuItem(router.getRoutes()));

// 面包屑
const breadcrumb = computed(() =>
  router.currentRoute.value.matched.concat().map(item => {
    return {
      path: item.path,
      breadcrumbName: item.meta.title || '',
    };
  })
);
// 用户
const currentUser = reactive({
  nickname: 'Admin',
  avatar: 'A',
});
</script>

<template>
  <WaterMark :content="waterMarkContent" :z-index="100">
    <pro-layout
      v-model:collapsed="state.collapsed"
      v-model:selectedKeys="state.selectedKeys"
      v-model:openKeys="state.openKeys"
      :menu-data="menuData"
      :breadcrumb="{ routes: breadcrumb }"
      disable-content-margin
      v-bind="proConfig"
      iconfont-url="/icon-font.js"
    >
      <!--页面路由导航面包屑-->
      <template #menuHeaderRender>
        <router-link :to="{ name: 'Index' }">
          <img src="../assets/vue.svg" />
          <h1>{{ systemName }}</h1>
        </router-link>
      </template>
      <!--页面路由导航面包屑-->
      <template #rightContentRender>
        <RightContent :current-user="currentUser" />
      </template>
      <!--页面路由导航面包屑-->
      <template #breadcrumbRender="{ route, params, routes }">
        <span v-if="routes.indexOf(route) === routes.length - 1">
          <TagOutlined />
          {{ route.breadcrumbName }}
        </span>
        <router-link v-else :to="{ path: route.path, params }">
          <TagsOutlined />
          {{ route.breadcrumbName }}
        </router-link>
      </template>
      <LayoutSetting />
      <!--页面视图-->
      <RouterView v-slot="{ Component, route }">
        <transition name="slide-left" mode="out-in">
          <div :key="route.name || 0">
            <component :is="Component" :key="route.path" />
          </div>
        </transition>
      </RouterView>
    </pro-layout>
  </WaterMark>
</template>
