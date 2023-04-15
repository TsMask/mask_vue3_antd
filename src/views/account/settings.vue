<script lang="ts" setup>
import BaseInfo from './components/base-info.vue';
import ResetPasswd from './components/reset-passwd.vue';
import { ref, onMounted } from 'vue';

let activeKey = ref<string>('1');

onMounted(() => {});
</script>

<template>
  <page-container>
    <a-card>
      <a-tabs tab-position="left" v-model:activeKey="activeKey">
        <a-tab-pane key="1" tab="基础信息">
          <BaseInfo></BaseInfo>
        </a-tab-pane>
        <a-tab-pane key="2" tab="重置密码">
          <ResetPasswd></ResetPasswd>
        </a-tab-pane>
        <a-tab-pane key="3" tab="cs">
          <a-list item-layout="vertical" size="large" row-key="title">
            <a-list-item>
              账户密码
              <template #actions> 当前密码强度:强 </template>
              <template #extra>
                <a-button type="link">修改</a-button>
              </template>
            </a-list-item>
          </a-list>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </page-container>
</template>

<style lang="less" scoped></style>
