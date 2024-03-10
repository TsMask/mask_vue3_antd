<script setup lang="ts">
import {
  ProLayout,
  GlobalFooter,
  getMenuData,
  clearMenuItem,
} from 'antdv-pro-layout';
import RightContent from './components/RightContent.vue';
import Tabs from './components/Tabs.vue';
import { scriptUrl } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { computed, reactive, watch } from 'vue';
import useLayoutStore from '@/store/modules/layout';
import useAppStore from '@/store/modules/app';
import useRouterStore from '@/store/modules/router';
import useTabsStore from '@/store/modules/tabs';
import { useRouter } from 'vue-router';
import { MENU_PATH_INLINE } from '@/constants/menu-constants';
const { proConfig, waterMarkContent } = useLayoutStore();
const { appName } = useAppStore();
const routerStore = useRouterStore();
const tabsStore = useTabsStore();
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
    // 路由地址含有内嵌地址标识又是隐藏菜单需要处理打开高亮菜单栏
    if (v.path.includes(MENU_PATH_INLINE) && v.meta.hideInMenu) {
      const idx = v.path.lastIndexOf(MENU_PATH_INLINE);
      layoutState.openKeys.splice(-1);
      layoutState.selectedKeys[matched.length - 1] = v.path.slice(0, idx);
    }
  },
  { immediate: true }
);

// 动态路由添加到菜单面板
const rootRoute = router.getRoutes().find(r => r.name === 'Root');
if (rootRoute) {
  const children = routerStore.setRootRouterData(rootRoute.children);
  const buildRouterData = routerStore.buildRouterData;
  if (buildRouterData.length > 0) {
    rootRoute.children = children.concat(buildRouterData);
  } else {
    rootRoute.children = children;
  }
}

const { menuData } = getMenuData(clearMenuItem(router.getRoutes()));

/**面包屑数据对象，排除根节点和首页不显示 */
const breadcrumb = computed(() => {
  const matched = router.currentRoute.value.matched.concat();
  // 菜单中隐藏子节点不显示面包屑
  if (matched.length == 2) {
    const hideChildInMenu = matched[0].meta?.hideChildInMenu || false;
    if (hideChildInMenu) {
      return [];
    }
  }
  return matched
    .filter(r => !['Root', 'Index'].includes(r.name as string))
    .map(item => {
      return {
        path: item.path,
        breadcrumbName: item.meta.title || '-',
      };
    });
});

/**
 * 给页面组件设置路由名称
 *
 * 路由名称设为缓存key
 * @param component 页面组件
 * @param name 路由名称
 */
function fnComponentSetName(component: any, to: any) {
  if (component && component.type) {
    // 通过路由取最后匹配的，确认是缓存的才处理
    const matched = to.matched.concat();
    const lastRoute = matched[matched.length - 1];
    if (!lastRoute.meta.cache) return component;
    const routeName = lastRoute.name;
    const routeDef = lastRoute.components.default;
    // 有命名但不是跳转的路由文件
    const __name = component.type.__name;
    if (__name && __name !== routeName) {
      routeDef.name = routeName;
      routeDef.__name = routeName;
      Reflect.set(component, 'type', routeDef);
      return component;
    }
  }
  return component;
}

// 清空导航栏标签
tabsStore.clear();
</script>

<template>
  <a-watermark :content="waterMarkContent" :z-index="100">
    <ProLayout
      v-model:collapsed="layoutState.collapsed"
      v-model:selectedKeys="layoutState.selectedKeys"
      v-model:openKeys="layoutState.openKeys"
      :menu-data="menuData"
      :breadcrumb="{ routes: breadcrumb }"
      disable-content-margin
      v-bind="proConfig"
      :iconfont-url="scriptUrl"
    >
      <!--插槽-菜单头-->
      <template #menuHeaderRender>
        <RouterLink :to="{ name: 'Index' }" :replace="true">
          <img class="app-logo" src="@/assets/logo.png" />
          <h1>{{ appName }}</h1>
        </RouterLink>
      </template>

      <!--插槽-顶部左侧，只对side布局有效-->
      <template #headerContentRender></template>

      <!--插槽-顶部右侧-->
      <template #rightContentRender>
        <RightContent />
      </template>

      <!--插槽-导航标签项-->
      <template #tabRender="{ width, fixedHeader, headerRender }">
        <Tabs
          :width="width"
          :fixed-header="fixedHeader"
          :header-render="headerRender"
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
          <KeepAlive :include="tabsStore.getCaches">
            <component
              :is="fnComponentSetName(Component, route)"
              :key="route.path"
            />
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
          copyright="Copyright © 2023 Gitee For TsMask"
        >
        </GlobalFooter>
      </template>
    </ProLayout>
  </a-watermark>
</template>

<style lang="less" scoped>
.app-logo {
  height: 32px;
  vertical-align: middle;
  border-style: none;
  border-radius: 6.66px;
}
</style>
