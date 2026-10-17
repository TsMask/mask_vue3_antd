<script setup lang="ts">
const copyright = 'Copyright © 2023-2026 Gitee For TsMask';

const footerLinks = [
  { blankTarget: false, title: '帮助', href: import.meta.env.BASE_URL },
  { blankTarget: false, title: '隐私', href: import.meta.env.BASE_URL },
  { blankTarget: false, title: '条款', href: import.meta.env.BASE_URL },
];
</script>

<template>
  <a-flex vertical align="center" :gap="8" :style="{ margin: '0', padding: '16px 0' }">
    <a-flex :gap="24" wrap="wrap">
      <a-typography-link
        v-for="link in footerLinks"
        :key="link.href"
        :href="link.href"
        :target="link.blankTarget ? '_blank' : undefined"
      >
        {{ link.title }}
      </a-typography-link>
    </a-flex>
    <a-typography-text type="secondary">{{ copyright }}</a-typography-text>
  </a-flex>
</template>
