<script setup lang="ts">
import { PageContainer } from 'antdv-pro-layout';
import { ref } from 'vue';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
import HomeDonate from './components/HomeDonate.vue';
import HomeIntroduction from './components/HomeIntroduction.vue';
import HomeProfile from './components/HomeProfile.vue';
import HomeQuickStart from './components/HomeQuickStart.vue';

const userStore = useUserStore();
const appStore = useAppStore();

const repositoryUrl = 'https://gitee.com/TsMask/';
const issuesUrl = 'https://gitee.com/TsMask/mask_vue3_antd/issues';

// 演示指标，接入后端统计接口后替换。
const onlineUserCount = ref(10000 + Math.floor(Math.random() * 10000));
</script>

<template>
  <PageContainer
    :breadcrumb="{}"
    :title="appStore.appName"
    sub-title="by TsMask"
  >
    <template #tags>
      <a-tag>当前版本：{{ appStore.appVersion }}</a-tag>
      <a-tag color="magenta"><PayCircleOutlined /> 免费开源</a-tag>
    </template>
    <template #extra>
      <a-button
        type="primary"
        :href="repositoryUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        开源仓库
      </a-button>
      <a-button
        type="default"
        :href="issuesUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        提些建议
      </a-button>
    </template>
    <template #content>
      <HomeProfile
        :avatar="userStore.getAvatar"
        :avatar-alt="userStore.user_name"
        :nickname="userStore.user_nick"
      />
    </template>
    <template #contentExtra>
      <a-space :size="16">
        <a-statistic title="在线用户" :value="onlineUserCount" />
      </a-space>
    </template>

    <a-row :gutter="16">
      <a-col :lg="16" :md="16" :xs="24">
        <HomeIntroduction />
      </a-col>
      <a-col :lg="8" :md="8" :xs="24">
        <a-space :size="16" direction="vertical">
          <HomeQuickStart />
          <HomeDonate />
        </a-space>
      </a-col>
    </a-row>
  </PageContainer>
</template>
