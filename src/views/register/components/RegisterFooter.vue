<script setup lang="ts">
import { GlobalFooter } from 'antdv-pro-layout';
</script>

<template>
  <GlobalFooter
    :style="{ margin: '0' }"
    :links="[
      { blankTarget: false, title: '帮助', href: '/' },
      { blankTarget: false, title: '隐私', href: '/' },
      { blankTarget: false, title: '条款', href: '/' },
    ]"
    copyright="Copyright © 2023-2026 Gitee For TsMask"
  />
</template>
