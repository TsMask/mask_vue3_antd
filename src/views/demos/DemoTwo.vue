<template>
  <a-layout class="layout">
    <a-layout-header>
      <div class="layout-logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :items="menuItems"
      />
    </a-layout-header>
    <a-layout-content class="layout-content">
      <a-breadcrumb style="margin: 16px 0" :items="[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]" />
      <div class="layout-content-main">Content {{ selectedKeys }}</div>
    </a-layout-content>
    <a-layout-footer class="layout-footer">
      Ant Design ©2018 Created by Ant UED
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { MenuProps } from 'antdv-next';

const selectedKeys = ref<string[]>(['2']);
const menuItems: MenuProps['items'] = [
  { key: '1', label: 'nav 1' },
  { key: '2', label: 'nav 2' },
  { key: '3', label: 'nav 3' },
];
</script>

<style scoped>
.layout-logo {
  float: left;
  width: 120px;
  height: 31px;
  margin: 16px 24px 16px 0;
  background: rgba(255, 255, 255, 0.12);
}

.ant-row-rtl .layout-logo {
  float: right;
  margin: 16px 0 16px 24px;
}

.layout-content {
  padding: 0 50px;
}
.layout-content-main {
  min-height: 280px;
  padding: 24px;
  background: #fff;
}
[data-theme='dark'] .layout-content-main {
  background: #141414;
}

.layout-footer {
  text-align: center;
}
</style>
