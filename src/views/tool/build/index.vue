<script lang="ts" setup>
import { ref } from 'vue';

const msg = ref<string>('愿这世间美好与你环环相扣');
</script>

<template>
  <h1>{{ msg }}</h1>
</template>

<style lang="less" scoped></style>
