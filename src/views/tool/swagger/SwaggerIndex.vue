<script lang="ts" setup>
import LinkIframe from '@/components/LinkIframe/LinkIframe.vue';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const url = `${baseUrl}/swagger-ui/index.html`;
</script>

<template>
  <LinkIframe :src="url"></LinkIframe>
</template>
