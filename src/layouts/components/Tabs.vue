<script lang="ts" setup>
import IconFont from '@/components/IconFont/index.vue';
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import useTabsStore from '@/store/modules/tabs';
const tabsStore = useTabsStore();
const router = useRouter();

defineProps({
  /**标签栏宽度 */
  width: {
    type: String,
    default: '100%',
  },
  /**是否固定顶部栏 */
  fixedHeader: {
    type: Boolean,
    default: false,
  },
});

/**导航标签项列表长度 */
let tabLen = computed(() => tabsStore.getTabs.length);

/**
 * 标签更多菜单项
 * @param key 菜单key
 */
function fnTabMenu(key: string | number) {
  const route = router.currentRoute.value;
  // 刷新当前
  if (key === 'reload') {
    const name = (route.name && route.name.toString()) || '';
    tabsStore.cacheDelete(name);
    router.replace({
      path: `/redirect${route.path}`,
      query: route.query,
    });
  }
  // 关闭当前
  if (key === 'current') {
    const to = tabsStore.tabClose(route.path);
    if (!to) return;
    // 避免重复跳转
    if (route.path === to.path) {
      tabsStore.tabOpen(route);
    } else {
      router.push(to);
    }
  }
  // 关闭其他
  if (key === 'other') {
    tabsStore.clear();
    tabsStore.tabOpen(route);
  }
  // 关闭全部
  if (key === 'all') {
    tabsStore.clear();
    // 已经是首页的避免重复跳转，默认返回首页
    if (route.path === '/index') {
      tabsStore.tabOpen(route);
    } else {
      router.push({ name: 'Index' });
    }
  }
}

/**
 * 导航标签点击
 * @param path 标签的路由路径
 */
function fnTabClick(path: string) {
  const to = tabsStore.tabGoto(path);
  if (!to) return;
  router.push(to);
}

/**
 * 导航标签关闭
 * @param path 标签的路由路径
 */
function fnTabClose(path: string) {
  const to = tabsStore.tabClose(path);
  if (!to) return;
  router.push(to);
}

/**监听当前路由添加到导航标签列表 */
watch(router.currentRoute, v => tabsStore.tabOpen(v), { immediate: true });
</script>

<template>
  <div>
    <header class="ant-layout-header tabs-header" v-if="fixedHeader"></header>
    <a-tabs
      class="tabs"
      :class="{ 'tabs-fixed': fixedHeader }"
      :style="{ width: width }"
      hide-add
      tab-position="top"
      type="editable-card"
      :tab-bar-gutter="8"
      :tab-bar-style="{ margin: '0', height: '28px', lineHeight: '28px' }"
      v-model:activeKey="tabsStore.activePath"
      @tab-click="path => fnTabClick(path as string)"
      @edit="path => fnTabClose(path as string)"
    >
      <a-tab-pane
        v-for="tab in tabsStore.getTabs"
        :key="tab.path"
        :closable="tabLen > 1"
      >
        <template #tab>
          <span>
            <IconFont :type="tab.icon" style="margin: 0"></IconFont>
            {{ tab.title }}
          </span>
        </template>
      </a-tab-pane>

      <template #rightExtra>
        <a-space :size="8" align="end">
          <a-tooltip placement="topRight">
            <template #title>刷新当前</template>
            <a-button
              type="ghost"
              shape="circle"
              size="small"
              @click="fnTabMenu('reload')"
            >
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>更多选项</template>
            <a-dropdown :trigger="['click', 'hover']" placement="bottomRight">
              <a-button type="ghost" shape="circle" size="small">
                <template #icon><DownOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu @click="({ key }) => fnTabMenu(key)">
                  <a-menu-item key="current">关闭当前</a-menu-item>
                  <a-menu-item key="other">关闭其他 </a-menu-item>
                  <a-menu-item key="all">关闭全部</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>
    </a-tabs>
  </div>
</template>

<style lang="less" scoped>
.tabs-header {
  height: 36px;
  line-height: 36px;
  background: transparent;
}

.tabs {
  z-index: 16;
  margin: 0px;
  padding: 4px 16px;
  width: calc(100% - 208px);
  background: #fff;
  box-shadow: 0 1px 4px #0015291f;
  transition: background 0.3s, width 0.2s;
  position: relative;

  &.tabs-fixed {
    right: 0px;
    top: 48px;
    position: fixed;
  }
}

.tabs :deep(.ant-tabs-nav:before) {
  border-bottom: none;
}
</style>
