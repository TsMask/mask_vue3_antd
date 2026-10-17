<script lang="ts" setup>
import { ref } from 'vue';
import type { TabsProps } from 'antdv-next';
import { PageContainer } from 'antdv-pro-layout';
import AccountBaseInfoForm from './components/AccountBaseInfoForm.vue';
import AccountResetPasswordForm from './components/AccountResetPasswordForm.vue';
import AccountStyleLayout from './components/AccountStyleLayout.vue';

type AccountSettingsTabKey = 'base-info' | 'reset-password' | 'style-layout';

const activeKey = ref<AccountSettingsTabKey>('base-info');
const accountTabs: TabsProps['items'] = [
  { key: 'base-info', label: '基础信息' },
  { key: 'reset-password', label: '重置密码' },
  { key: 'style-layout', label: '个性化' },
];
</script>

<template>
  <PageContainer>
    <a-card>
      <a-tabs
        v-model:activeKey="activeKey"
        tab-placement="top"
        :items="accountTabs"
      >
        <template #contentRender="{ item }">
          <AccountBaseInfoForm v-if="item.key === 'base-info'" />
          <AccountResetPasswordForm
            v-else-if="item.key === 'reset-password'"
          />
          <AccountStyleLayout v-else />
        </template>
      </a-tabs>
    </a-card>
  </PageContainer>
</template>
