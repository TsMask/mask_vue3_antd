<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue/lib';
import { usePrimaryColor } from '@/hooks/useTheme';
import zhCN from 'ant-design-vue/lib/locale/zh_CN';
import enUS from 'ant-design-vue/lib/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { ref, watch } from 'vue';
import useI18n from '@/hooks/useI18n';
const { currentLocale } = useI18n();

dayjs.locale('zh-cn'); // 默认中文
usePrimaryColor(); // 载入用户自定义主题色

let locale = ref(zhCN); // 国际化初始中文

// 国际化切换语言
function fnChangeLocale(v: string) {
  switch (v) {
    case 'zh_CN':
      locale.value = zhCN;
      dayjs.locale(zhCN.locale);
      break;
    case 'en_US':
      locale.value = enUS;
      dayjs.locale(enUS.locale);
      break;
  }
}

// 加载多语言并进行监听
fnChangeLocale(currentLocale.value);
watch(currentLocale, val => {
  fnChangeLocale(val);
});
</script>

<template>
  <ConfigProvider :locale="locale">
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
