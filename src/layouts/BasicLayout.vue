<script setup lang="ts">
import RightContent from './components/RightContent.vue';
import LayoutSetting from './components/LayoutSetting.vue';
import {
  GlobalFooter,
  WaterMark,
  getMenuData,
  clearMenuItem,
} from '@ant-design-vue/pro-layout';
import { computed, reactive, watch } from 'vue';
import useLayoutStore from '@/store/modules/layout';
import useAppStore from '@/store/modules/app';
import useRouterStore from '@/store/modules/router';
import { useRouter } from 'vue-router';
const { buildRouterData } = useRouterStore();
const { proConfig, waterMarkContent } = useLayoutStore();
const { systemName } = useAppStore();
const router = useRouter();

/**菜单面板 */
let layoutState = reactive({
  collapsed: false, // 是否展开菜单面板
  openKeys: ['/'], // 打开菜单key
  selectedKeys: ['/index'], // 选中高亮菜单key
});

/**监听路由变化改变菜单面板选项 */
watch(
  router.currentRoute,
  v => {
    const matched = v.matched.concat();
    layoutState.openKeys = matched
      .filter(r => r.path !== v.path)
      .map(r => r.path);
    layoutState.selectedKeys = matched
      .filter(r => r.name !== 'Root')
      .map(r => r.path);
    // 路由地址含有"/inline"又是隐藏菜单需要处理打开高亮菜单栏
    if (v.path.includes('/inline') && v.meta.hideInMenu) {
      const idx = v.path.lastIndexOf('/inline');
      layoutState.openKeys.splice(-1);
      layoutState.selectedKeys[matched.length - 1] = v.path.slice(0, idx);
    }
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

/**面包屑数据对象 */
const breadcrumb = computed(() => {
  const matched = router.currentRoute.value.matched.concat();
  return matched
    .filter(r => r.name !== 'Root')
    .map(item => {
      return {
        path: item.path,
        name: item.name,
        title: item.meta.title || '-',
      };
    });
});
</script>

<template>
  <WaterMark :content="waterMarkContent" :z-index="100">
    <pro-layout
      v-model:collapsed="layoutState.collapsed"
      v-model:selectedKeys="layoutState.selectedKeys"
      v-model:openKeys="layoutState.openKeys"
      :menu-data="menuData"
      :breadcrumb="{ routes: breadcrumb }"
      disable-content-margin
      v-bind="proConfig"
      iconfont-url="/font_8d5l8fzk5b87iudi.js"
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
          {{ route.title }}
        </span>
        <router-link v-else :to="{ path: route.path, params }">
          {{ route.title }}
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
  vertical-align: middle;
  border-style: none;
  border-radius: 6.66px;
}
</style>
