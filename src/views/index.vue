<template>
  <div class="app-container home">
    {{ version }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const version = ref('0.0.1');
</script>

<style scoped></style>
