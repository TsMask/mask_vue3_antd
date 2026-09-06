<script setup lang="ts">
import { PageContainer } from 'antdv-pro-layout';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
import Profile from './components/Profile.vue';
import Introduction from './components/Introduction.vue';
import QuickStart from './components/QuickStart.vue';
import Donate from './components/Donate.vue';

const userStore = useUserStore();
const { appName, appVersion } = useAppStore();

/** 跳转 */
function goTarget(type: string) {
  let url = '';
  if (type === 'code') {
    url = 'https://gitee.com/TsMask/';
  }
  if (type === 'issues') {
    url = 'https://gitee.com/TsMask/mask_vue3_antd/issues';
  }
  window.open(url, '__blank');
}
</script>

<template>
  <PageContainer :breadcrumb="{}" :title="appName" sub-title="by TsMask">
    <template #tags>
      <a-tag>当前版本：{{ appVersion }}</a-tag>
      <a-tag color="magenta"><PayCircleOutlined /> 免费开源</a-tag>
    </template>
    <template #extra>
      <a-button type="primary" @click="goTarget('code')">开源仓库</a-button>
      <a-button type="default" @click="goTarget('issues')">提些建议</a-button>
    </template>
    <template #content>
      <Profile
        :avatar="userStore.getAvatar"
        :alt="userStore.user_name"
        :nickname="userStore.user_nick"
      />
    </template>
    <template #contentExtra>
      <a-space :size="16">
        <a-statistic
          title="在线用户"
          :value="Math.round(Math.random() * 10000 + 10000)"
        />
      </a-space>
    </template>

    <a-row :gutter="16">
      <a-col :lg="16" :md="16" :xs="24">
        <Introduction />
      </a-col>
      <a-col :lg="8" :md="8" :xs="24">
        <a-space :size="16" direction="vertical">
          <QuickStart />
          <Donate />
        </a-space>
      </a-col>
    </a-row>
  </PageContainer>
</template>
