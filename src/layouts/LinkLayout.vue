<script setup lang="ts">
import { isValid, decode } from 'js-base64';
import { useRoute } from 'vue-router';
import { reactive, ref } from 'vue';
import { validHttp } from '@/utils/regular-utils';
const route = useRoute();
const height = ref<string>(document.documentElement.clientHeight - 94.5 + 'px');

let iframe = reactive({
  id: 'link',
  src: '',
});

// 设置Frame窗口名称并设置链接地址
if (route.name) {
  const name = route.name.toString();
  const pathArr = route.matched.concat().map(i => i.path);
  const pathLen = pathArr.length;
  let path = pathArr[pathLen - 1].replace(pathArr[pathLen - 2], '');
  path = path.substring(1);
  if (isValid(path)) {
    const url = decode(path);
    if (validHttp(url)) {
      iframe.src = url;
    } else {
      let endS = name.substring(4, 5).endsWith('s');
      iframe.src = `${endS ? 'https://' : 'http://'}${url}`;
    }
  }

  iframe.id = name;
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

<style lang="less" scoped></style>
