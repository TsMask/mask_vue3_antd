<template>
  <pro-layout
    v-model:collapsed="state.collapsed"
    v-model:selectedKeys="state.selectedKeys"
    v-model:openKeys="state.openKeys"
    :loading="loading"
    :menu-data="menuData"
    :breadcrumb="{ routes: breadcrumb }"
    disable-content-margin
    v-bind="proConfig"
    iconfont-url="/icon-font.js"
    >
    <template #menuHeaderRender>
      <router-link :to="{ path: '/' }">
        <img src="../assets/vue.svg" />
        <h1 align-middle>Preview Pro</h1>
      </router-link>
    </template>
    <template #rightContentRender>
      <RightContent :current-user="currentUser" />
    </template>
    <!-- custom breadcrumb itemRender  -->
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
    <SettingDrawer v-model="proConfig" />
    <RouterView v-slot="{ Component, route }">
      <transition name="slide-left" mode="out-in">
        <div :key="route.name || 0">
          <WaterMark content="Pro Layout">
            <component :is="Component" :key="route.path" />
          </WaterMark>
        </div>
      </transition>
    </RouterView>
  </pro-layout>
</template>

<script setup lang="ts">
import RightContent from './RightContent.vue';
import SettingDrawer from './SettingDrawer.vue';
import {
  WaterMark,
  getMenuData,
  clearMenuItem,
  type RouteContextProps,
} from '@ant-design-vue/pro-layout';
import { TagsOutlined, TagOutlined } from '@ant-design/icons-vue';
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const { menuData } = getMenuData(clearMenuItem(router.getRoutes()));

const state = reactive<Omit<RouteContextProps, 'menuData'>>({
  collapsed: false, // default collapsed
  openKeys: [], // default openKeys
  selectedKeys: [], // default selectedKeys
});
const loading = ref(false);
const proConfig = ref({
  layout: 'side',
  navTheme: 'light',
  headerTheme: 'dark', // mix生效
  fixedHeader: true,
  fixSiderbar: true,
  splitMenus: true,
});
const breadcrumb = computed(() =>
  router.currentRoute.value.matched.concat().map(item => {
    return {
      path: item.path,
      breadcrumbName: item.meta.title || '',
    };
  })
);
const currentUser = reactive({
  nickname: 'Admin',
  avatar: 'A',
});
watch(
  router.currentRoute,
  () => {
    const matched = router.currentRoute.value.matched.concat();
    state.selectedKeys = matched
      .filter(r => r.name !== 'index')
      .map(r => r.path);
    state.openKeys = matched
      .filter(r => r.path !== router.currentRoute.value.path)
      .map(r => r.path);
  },
  {
    immediate: true,
  }
);
</script>
