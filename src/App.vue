<script setup lang="ts">
import { onBeforeMount, onMounted, watch } from 'vue';
import useAppStore from '@/store/modules/app';
import { useLayoutSettings } from '@/layouts/hooks/useLayoutSettings';
import { usePrefersColorScheme, viewTransitionTheme } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn'); // 设置默认语言为中文

const appStore = useAppStore();
const { themeConfig, initialize, changeConfig } = useLayoutSettings();
const colorScheme = usePrefersColorScheme();

/**
 * 初始化全局配置
 */
function initializeGlobalConfig() {
  message.config({
    top: '100px',
    duration: 3,
    maxCount: 15,
  });
  initialize();
}

/**
 * 处理颜色方案变化
 */
function handleColorSchemeChange(themeMode: 'light' | 'dark') {
  viewTransitionTheme(() => {
    changeConfig('theme', themeMode);
  });
}

/**
 * 记录应用版本信息
 */
function logAppVersion() {
  console.info(
    `%c ${appStore.appName} %c ${appStore.appCode} - ${appStore.appVersion} `,
    'color: #fadfa3; background: #030307; padding: 4px 0;',
    'color: #030307; background: #fadfa3; padding: 4px 0;'
  );
}

watch(colorScheme, handleColorSchemeChange);

onBeforeMount(initializeGlobalConfig);
onMounted(logAppVersion);
</script>

<template>
  <a-config-provider
    :theme="themeConfig"
    :locale="zhCN"
    :component-size="appStore.componentSize"
  >
    <RouterView />
  </a-config-provider>
</template>

<style lang="css">
#app {
  height: 100%;
}

body .ant-pro-basicLayout {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition-duration: 0.5s;
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.55, 0, 0.1, 1);
  overflow: hidden;
}

.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
  transform: translate(2em, 0);
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

[data-theme='dark']::view-transition-old(root) {
  z-index: 1;
}

[data-theme='dark']::view-transition-new(root) {
  z-index: 999;
}

::view-transition-old(root) {
  z-index: 999;
}

::view-transition-new(root) {
  z-index: 1;
}
</style>
