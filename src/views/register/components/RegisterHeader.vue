<script setup lang="ts">
import logo from '@/assets/logo.png';
</script>

<template>
  <a-flex vertical align="center" :gap="8">
    <router-link to="/">
      <a-space :size="12" align="center">
        <a-image
          :src="logo"
          :width="44"
          :height="44"
          :preview="false"
          style="border-radius: 8px"
        />
        <a-typography-title :level="3" :style="{ marginBottom: 0 }">
          Mask Antd Vue3
        </a-typography-title>
      </a-space>
    </router-link>
    <a-typography-text type="secondary">
      基于 antdv-next + vue3 的管理系统
    </a-typography-text>
  </a-flex>
</template>
