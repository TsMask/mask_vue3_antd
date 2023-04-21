<script lang="ts" setup>
import { DownOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import IconFont from '@/components/IconFont/index.vue';
import { computed, onMounted, reactive, watch } from 'vue';
import { RouteLocationNormalizedLoaded, useRouter } from 'vue-router';
import useTabsStore from '@/store/modules/tabs';
const tabsStore = useTabsStore();
const router = useRouter();

/**标签属性状态 */
let tabState = reactive({
  /**标签栏宽度 */
  width: '100%',
  /**标签激活项 */
  activeKey: '',
});

/**导航标签项列表长度 */
let tabLen = computed(() => tabsStore.getTabs.length);

/**
 * 标签更多菜单项
 * @param key 菜单key
 */
function fnTabMenu(key: string | number) {
  console.log(key);
  const route = router.currentRoute.value;
  // 刷新当前
  if (key === 'reload') {
    tabsStore.removeCache(route.path);
    router.replace({
      path: `/redirect${route.path}`,
      query: route.query,
    });
  }
  // 关闭当前
  if (key === 'current') {
    fnTabClose(route.path);
  }
  // 关闭其他
  if (key === 'other') {
    tabsStore.clear();
    fnTabAdd(route);
  }
  // 关闭全部
  if (key === 'all') {
    tabsStore.clear();
    // 已经是首页的避免重复跳转，默认返回首页
    if (route.path === '/index') {
      fnTabAdd(route);
    } else {
      router.push('/index');
    }
  }
}

/**
 * 导航标签点击
 * @param path 标签的路由路径
 */
function fnTabClick(path: string) {
  router.push(`${path}`);
}

/**
 * 导航标签关闭
 * @param path 标签的路由路径
 */
function fnTabClose(path: string) {
  // 获取当前项和最后项下标
  const tabIndex = tabsStore.getTabs.findIndex(tab => tab.path === path);
  const lastIndex = tabLen.value - 1;

  // 只有一项默认跳首页
  if (lastIndex === 0) {
    router.push('/index');
  }
  // 关闭当期标签，操作第一项跳后一项
  if (path === tabState.activeKey && tabIndex === 0) {
    const tab = tabsStore.getTabs[tabIndex + 1];
    router.push(tab.path);
  }
  // 关闭当期标签，默认跳前一项
  if (path === tabState.activeKey && tabIndex <= lastIndex) {
    const tab = tabsStore.getTabs[tabIndex - 1];
    router.push(tab.path);
  }

  // 移除标签
  tabsStore.remove(path);
}

/**
 * 导航标签新增
 * @param raw 当前路由
 */
function fnTabAdd(raw: RouteLocationNormalizedLoaded) {
  // 刷新重定向不记录
  if (raw.path.startsWith('/redirect')) return;
  const name = raw.name && raw.name.toString();
  if (!name) return;
  // 新增到当期标签后面打开，获取当期标签下标
  const tabIndex = tabsStore.getTabs.findIndex(
    tab => tab.path === tabState.activeKey
  );
  tabsStore.add(
    {
      path: raw.path,
      name: name,
      title: raw.meta.title || '-',
      icon: raw.meta.icon || '#',
      cache: Boolean(raw.meta.cache),
    },
    tabIndex + 1
  );
  // 设置激活项
  tabState.activeKey = raw.path;
}

/**监听当前路由添加到导航标签列表 */
watch(router.currentRoute, v => fnTabAdd(v), { immediate: true });

/**计算侧边栏的宽度，不然导致左边的样式会出问题 */
onMounted(() => {
  const element = document.getElementsByClassName('ant-pro-fixed-header');
  if (element && element.length > 0) {
    // 获取初始宽度
    const { width } = Reflect.get(element[0], 'style');
    tabState.width = width;
    // 监听DOM中style属性变化，这属于全局的监听没做销毁
    let MutationObserver = window.MutationObserver;
    new MutationObserver(callback => {
      if (callback && callback.length > 0) {
        const { width } = Reflect.get(callback[0].target, 'style');
        tabState.width = width;
      }
    }).observe(element[0], {
      attributeFilter: ['style'],
      attributes: true,
      attributeOldValue: false,
      characterData: false,
      characterDataOldValue: false,
      childList: false,
      subtree: false,
    });
  }
});
</script>

<template>
  <div>
    <header
      class="ant-layout-header"
      style="height: 36px; line-height: 36px; background: transparent"
    ></header>
    <a-tabs
      class="tabs"
      :style="{ width: tabState.width }"
      hide-add
      tab-position="top"
      type="editable-card"
      :tab-bar-gutter="8"
      :tab-bar-style="{ margin: '0', height: '28px', lineHeight: '28px' }"
      v-model:activeKey="tabState.activeKey"
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
        <a-space :size="8" align="center">
          <a-tooltip>
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
          <a-tooltip>
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
.tabs {
  z-index: 16;
  margin: 0px;
  padding: 4px 16px;
  width: calc(100% - 208px);
  right: 0px;
  top: 48px;
  position: fixed;
  background: #fff;
  box-shadow: 0 1px 4px #0015291f;
  transition: background 0.3s, width 0.2s;
}

.tabs :deep(.ant-tabs-nav:before) {
  border-bottom: none;
}
</style>
