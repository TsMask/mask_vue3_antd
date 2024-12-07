<script lang="ts" setup>
import LinkiFrame from '@/components/LinkiFrame/index.vue';
import { ref } from 'vue';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const url = ref<string>(`${baseUrl}/swagger-ui/index.html`);
// url.value = 'https://mask-api-midwayjs.apifox.cn/';
url.value = 'https://mask-api-gin.apifox.cn/';
</script>

<template>
  <LinkiFrame :src="url"></LinkiFrame>
</template>

<style lang="less" scoped></style>
