<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const { params, query } = route;

router.replace({ path: `/${params.path}`, query });
</script>

<template>
  <span>稍等...</span>
</template>
