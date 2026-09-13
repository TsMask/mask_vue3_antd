<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref } from 'vue';
import { validHttp } from '@/utils/regular';
const route = useRoute();
const height = ref<string>(document.documentElement.clientHeight - 94.5 + 'px');

let iframe = reactive({
  id: 'link',
  src: '',
});

// 设置Frame窗口名称并设置链接地址
if (route.name) {
  iframe.id = route.name.toString();
}

const href = route.meta.href;
if (href && validHttp(href)) {
  iframe.src = href;
}
</script>

<template>
  <div :style="'height:' + height">
    <iframe
      :id="iframe.id"
      :src="iframe.src"
      frameborder="no"
      style="width: 100%; height: 100%"
      scrolling="auto"
    ></iframe>
  </div>
</template>

<style scoped></style>
