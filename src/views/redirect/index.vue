<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const { params, query } = router.currentRoute.value;

router.replace({ path: `/${params.path}`, query });
</script>

<template>
  <span>稍等...</span>
</template>
