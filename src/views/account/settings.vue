<script lang="ts" setup>
import { ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import BaseInfo from './components/base-info.vue';
import ResetPassword from './components/reset-password.vue';
import StyleLayout from './components/style-layout.vue';

/**Tab标签激活 */
let activeKey = ref<string>('base-info');
</script>

<template>
  <PageContainer>
    <a-card>
      <a-tabs tab-position="top" v-model:activeKey="activeKey">
        <a-tab-pane key="base-info" tab="基础信息">
          <BaseInfo></BaseInfo>
        </a-tab-pane>
        <a-tab-pane key="reset-password" tab="重置密码">
          <ResetPassword></ResetPassword>
        </a-tab-pane>
        <a-tab-pane key="style-layout" tab="个性化">
          <StyleLayout></StyleLayout>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </PageContainer>
</template>

<style lang="less" scoped></style>
