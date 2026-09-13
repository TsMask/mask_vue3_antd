<script setup lang="ts">
import { ProLayout, TabsView } from 'antdv-pro-layout';
import RightContent from './components/RightContent.vue';
import LayoutFooter from './components/LayoutFooter.vue';
import { useTabsView } from './hooks/useTabsView';
import { useNavigation } from './hooks/useNavigation';
import { scriptUrl } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { computed, ref } from 'vue';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
import { useLayoutSettings } from '@/layouts/hooks/useLayoutSettings';
import { HOME_PATH } from '@/constants/router';
const { appName } = useAppStore();
const { proConfig } = useLayoutSettings();
const userStore = useUserStore();
const { tabsView, handleTabSelect, handleTabClose, handleTabAction } =
  useTabsView({ syncRoute: true });
const { navigationMenus, breadcrumb, navigationState } = useNavigation();

/** 水印由当前登录用户派生，用户 Store 不反向修改布局状态。 */
const waterMarkContent = computed(() => {
  if (!userStore.user_nick) return appName;
  return userStore.user_phone
    ? `${userStore.user_nick} ${userStore.user_phone}`
    : userStore.user_nick;
});

const collapsed = ref(false);
</script>

<template>
  <a-watermark :content="waterMarkContent" :z-index="100">
    <ProLayout
      v-model:collapsed="collapsed"
      v-model:selectedKeys="navigationState.selectedKeys"
      v-model:openKeys="navigationState.openKeys"
      :menu-data="navigationMenus"
      :breadcrumb="{ routes: breadcrumb }"
      v-bind="proConfig"
      :iconfont-url="scriptUrl"
    >
      <!--插槽-菜单头-->
      <template #menuHeaderRender>
        <RouterLink :to="HOME_PATH" replace>
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
      <template #breadcrumbRender="{ route, routes }">
        <span v-if="routes.indexOf(route) === routes.length - 1">
          {{ route.breadcrumbName }}
        </span>
        <RouterLink v-else :to="route.path">
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
        <LayoutFooter />
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
