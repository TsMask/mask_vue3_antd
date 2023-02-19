/**基础布局 */
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
import { RouteRecordRaw, useRouter } from 'vue-router';
import useRouterStore from '@/store/modules/router';
const router = useRouter();

const { menuData } = useRouterStore();
// const addRoutes = computed(() => permissionStore.addRoutes);
// const keysr = JSON.parse(JSON.stringify(addRoutes.value));
// console.log(keysr);
// const srs = [];
// JSON.parse(JSON.stringify(addRoutes.value)).forEach(item => {

// console.log(router.getRoutes());
// const its = [];
// keysr.forEach(k => {
//   k.meta.icon = 'icon-pcduan';
//   if (k.path.indexOf('ttp') === -1) {
//     const s2 = [];
//     if (Array.isArray(k.children)) {
//       k.children.forEach(o => {
//         if (o.path.indexOf('ttp') === -1) {
//           o.meta.icon = 'icon-pcduan';

//           if (o.meta.link && o.meta.link.indexOf('ttp') !== -1) {
//             o.meta.target = 'slef';
//           }
//           s2.push({
//             path: o.path,
//             name: o.name,
//             meta: o.meta,
//           });
//         } else {
//           o.meta.target = '_blank';
//           o.meta.icon = 'icon-pcduan';
//           s2.push({
//             path: o.path,
//             name: o.name,
//             meta: o.meta,
//           });
//         }
//       });
//     }
//     its.push({
//       path: k.path,
//       name: k.name,
//       meta: k.meta,
//       children: s2,
//     });
//   } else {
//     k.meta.target = '_blank';
//     its.push({
//       path: k.path,
//       name: k.name,
//       meta: k.meta,
//       children: [],
//     });
//   }
// });
// router.getRoutes().forEach(sr=>{
//   if(keysr.includes(sr.path)){
//     if(Array.isArray(sr.children)){
//       sr.children.map(c=>c.component=()=>{})
//     }
//     its.push(sr);
//   }
// })
// console.log(its);

// const clearMenuItems = clearMenuItem(router.getRoutes()).filter(
//   item => !['/', ''].includes(item.path)
// );
// console.log(clearMenuItems);
// let indexItem = router.getRoutes().find(item => ['/', ''].includes(item.path));
// indexItem = Object.assign(indexItem || {});
// if (indexItem) {
//   indexItem.path = '/';
//   const sss = indexItem.children.map(o => {
//     return {
//       name: o.name,
//       path: o.path,
//       meta: o.meta,
//     };
//   });
//   console.log(sss);
//   indexItem.children = sss.concat(its);
// }
// console.log(indexItem);
// const { menuData } = getMenuData([indexItem as RouteRecordRaw]);

// router
//   .getRoutes()
//   .map(r => r.path)
//   .forEach(i => {
//     const sd = clearMenuItem(router.getRoutes()).map(r => r.path);
//     if (!sd.includes(i)) {
//       console.log(i);
//     }
//   });

console.log(clearMenuItem(router.getRoutes())[30])

// const { menuData } = getMenuData([clearMenuItem(router.getRoutes())[30]]);
console.log(menuData);
const state = reactive<Omit<RouteContextProps, 'menuData'>>({
  collapsed: false, // default collapsed
  openKeys: [], // default openKeys
  selectedKeys: [], // default selectedKeys
});
const loading = ref(false);
const proConfig = ref({
  layout: 'side',
  navTheme: 'light',
  headerTheme: 'light', // layout=mix生效
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

<template>
  <WaterMark content="Pro Layout" :z-index="100">
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
    <!--页面路由导航面包屑-->
      <template #menuHeaderRender>
        <router-link :to="{ path: '/' }">
          <img src="../assets/vue.svg" />
          <h1 align-middle>Preview Pro</h1>
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
      <SettingDrawer v-model="proConfig" />
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
