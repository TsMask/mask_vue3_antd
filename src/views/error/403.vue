<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

function handleBack() {
  router.back();
}
</script>

<template>
  <a-result
    status="403"
    title="没有访问权限"
    sub-title="请不要进行非法操作，您可以返回主页面或返回"
  >
    <template #extra>
      <RouterLink :to="{ name: 'Index' }" :replace="true">
        <a-button type="primary"> 返回首页 </a-button>
      </RouterLink>
      <a-button type="default" @click="handleBack"> 返回 </a-button>
    </template>
  </a-result>
</template>
