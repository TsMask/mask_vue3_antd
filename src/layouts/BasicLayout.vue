<script setup lang="ts">
import RightContent from './components/RightContent.vue';
import LayoutSetting from './components/LayoutSetting.vue';
import {
  GlobalFooter,
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
      <!--插槽-菜单头-->
      <template #menuHeaderRender>
        <router-link :to="{ name: 'Index' }">
          <img class="logo" src="@/assets/logo.png" />
          <h1>{{ systemName }}</h1>
        </router-link>
      </template>

      <!--插槽-顶部左侧-->
      <template #headerContentRender></template>

      <!--插槽-顶部右侧-->
      <template #rightContentRender>
        <RightContent />
        <LayoutSetting />
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

      <!--页面视图-->
      <RouterView v-slot="{ Component, route }">
        <transition name="slide-left" mode="out-in">
          <div :key="route.name || 0">
            <component :is="Component" :key="route.path" />
          </div>
        </transition>
      </RouterView>

      <!--插槽-底部-->
      <template #footerRender>
        <GlobalFooter
          :links="[
            { blankTarget: true, title: '帮助', href: '/' },
            { blankTarget: true, title: '隐私', href: '/' },
            { blankTarget: false, title: '条款', href: '/' },
          ]"
          copyright="Copyright © 2023 Gitee For TsMask"
        >
        </GlobalFooter>
      </template>
    </pro-layout>
  </WaterMark>
</template>

<style lang="less" scoped>
.logo {
  height: 32px;
  vertical-align: top;
  border-style: none;
  border-radius: 6.66px;
}
</style>
