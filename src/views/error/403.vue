<template>
  <a-row :gutter="20">
    <a-col :span="12">
      <img src="@/assets/images_error/403.svg" width="313" height="428" alt="403!"
    /></a-col>
    <a-col :span="12">
      <h1 class="text-jumbo text-ginormous">403错误!</h1>
      <h2>您没有访问权限！</h2>
      <h6>对不起，您没有访问权限，请不要进行非法操作！您可以返回主页面</h6>
      <a-button type="primary" href="/index"> 返回首页 </a-button>
      <a-button @click="back"> 返回 </a-button>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

function back() {
  if (!route.query.back) {
    router.push({ path: '/index' });
  } else {
    router.go(-1);
  }
}
</script>

<style lang="less" scoped></style>
