<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <a-result
    status="403"
    title="没有访问权限"
    sub-title="请不要进行非法操作，您可以返回主页面或返回"
  >
    <template #extra>
      <a-button type="primary" href="/index"> 返回首页 </a-button>
      <a-button @click="() => router.go(-1)"> 返回 </a-button>
    </template>
  </a-result>
</template>

<style lang="less" scoped></style>
