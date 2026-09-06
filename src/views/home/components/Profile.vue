<script setup lang="ts">
defineProps<{
  avatar: string;
  alt: string;
  nickname: string;
}>();
</script>

<template>
  <a-space :size="16" align="center">
    <a-avatar shape="circle" :size="72" :src="avatar" :alt="alt" />
    <span class="nickname">{{ nickname }}，想必你那里一切安好吧。</span>
  </a-space>
</template>

<style scoped>
.nickname {
  margin-bottom: 12px;
  color: inherit;
  opacity: 0.85;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
}
</style>
