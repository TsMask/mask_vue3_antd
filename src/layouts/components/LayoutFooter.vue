<script setup lang="ts">
import { GlobalFooter } from 'antdv-pro-layout';

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
  <GlobalFooter
    :links="footerLinks"
    copyright="Copyright © 2023-2026 Gitee For TsMask"
  />
</template>
