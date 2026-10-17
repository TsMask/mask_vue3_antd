<script setup lang="ts">
const copyright = 'Copyright © 2023-2026 Gitee For TsMask';

const footerLinks = [
  {
    blankTarget: true,
    title: '开发手册',
    href: 'https://juejin.cn/column/7188761626017792056',
  },
  {
    blankTarget: true,
    title: '开源仓库',
    href: 'https://gitee.com/TsMask/',
  },
  {
    blankTarget: true,
    title: '接口文档',
    href: 'https://mask-api-midwayjs.apifox.cn/',
  },
];
</script>

<template>
  <a-flex vertical align="center" :gap="8" :style="{ padding: '16px 0' }">
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
