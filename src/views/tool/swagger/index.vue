<script lang="ts" setup>
import LinkiFrame from '@/components/LinkiFrame/index.vue';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const url = `${baseUrl}/swagger-ui/index.html`;
</script>

<template>
  <LinkiFrame :src="url"></LinkiFrame>
</template>
