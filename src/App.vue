<script setup lang="ts">
import { onMounted, onBeforeMount, watch } from 'vue';
import useLayoutStore from '@/store/modules/layout';
import useAppStore from '@/store/modules/app';
import { usePrefersColorScheme, viewTransitionTheme } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn'); // 默认中文
const appStore = useAppStore();
const colorScheme = usePrefersColorScheme();
const { themeConfig, initPrimaryColor, changeConf } = useLayoutStore();

watch(
  () => colorScheme.value,
  themeMode => {
    viewTransitionTheme(() => {
      changeConf('theme', themeMode);
    });
  }
);

onBeforeMount(() => {
  // 全局message提示
  message.config({
    top: '100px', // 距离顶部位置100px
    duration: 3,
    maxCount: 15,
  });
  initPrimaryColor();
});

onMounted(() => {
  // 输出应用版本号
  console.info(
    `%c ${appStore.appName} %c ${appStore.appCode} - ${appStore.appVersion} `,
    'color: #fadfa3; background: #030307; padding: 4px 0;',
    'color: #030307; background: #fadfa3; padding: 4px 0;'
  );
});
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

<style>
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
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition-duration: 0.5s;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.55, 0, 0.1, 1);
  overflow: hidden;
}

.slide-left-enter,
.slide-right-leave-active {
  opacity: 0;
  transform: translate(2em, 0);
}

.slide-left-leave-active,
.slide-right-enter {
  opacity: 0;
  transform: translate(-2em, 0);
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
