<script lang="ts" setup>
import { ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import AccountBaseInfoForm from './components/AccountBaseInfoForm.vue';
import AccountResetPasswordForm from './components/AccountResetPasswordForm.vue';
import AccountStyleLayout from './components/AccountStyleLayout.vue';

type AccountSettingsTabKey = 'base-info' | 'reset-password' | 'style-layout';

const activeKey = ref<AccountSettingsTabKey>('base-info');
</script>

<template>
  <PageContainer>
    <a-card>
      <a-tabs v-model:activeKey="activeKey" tab-position="top">
        <a-tab-pane key="base-info" tab="基础信息">
          <AccountBaseInfoForm />
        </a-tab-pane>
        <a-tab-pane key="reset-password" tab="重置密码">
          <AccountResetPasswordForm />
        </a-tab-pane>
        <a-tab-pane key="style-layout" tab="个性化">
          <AccountStyleLayout />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </PageContainer>
</template>
