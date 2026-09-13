<script setup lang="ts">
import { GlobalFooter } from 'antdv-pro-layout';

const footerLinks = [
  { blankTarget: false, title: '帮助', href: import.meta.env.BASE_URL },
  { blankTarget: false, title: '隐私', href: import.meta.env.BASE_URL },
  { blankTarget: false, title: '条款', href: import.meta.env.BASE_URL },
];
</script>

<template>
  <GlobalFooter
    :style="{ margin: '0' }"
    :links="footerLinks"
    copyright="Copyright © 2023-2026 Gitee For TsMask"
  />
</template>
