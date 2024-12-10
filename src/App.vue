<script setup lang="ts">
import { ConfigProvider, message } from 'ant-design-vue/lib';
import { usePrimaryColor } from '@/hooks/useTheme';
import useAppStore from '@/store/modules/app';
import zhCN from 'ant-design-vue/lib/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { onBeforeMount, onMounted } from 'vue';
dayjs.locale('zh-cn'); // 默认中文
const appStore = useAppStore();

onBeforeMount(() => {
  // 全局message提示
  message.config({
    top: '100px', // 距离顶部位置100px
    duration: 3,
    maxCount: 15,
  });
  usePrimaryColor(); // 载入用户自定义主题色
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
  <ConfigProvider :locale="zhCN" :component-size="appStore.componentSize">
    <RouterView />
  </ConfigProvider>
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

.ant-pro-sider {
  z-index: 20;
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
</style>
