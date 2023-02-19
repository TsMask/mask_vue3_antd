<template>
   <i-frame v-model:src="url"></i-frame>
</template>

<script lang="ts" setup>
import iFrame from '@/components/iFrame/index.vue'
import { ref } from 'vue';

const url = ref(import.meta.env.VITE_API_BASE_URL + "/swagger-ui/index.html")
</script>
