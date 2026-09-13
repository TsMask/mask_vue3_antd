<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { PageContainer } from 'antdv-pro-layout';
import SystemDiskTable from './components/SystemDiskTable.vue';
import SystemProjectInfoCard from './components/SystemProjectInfoCard.vue';
import SystemResourceInfoCard from './components/SystemResourceInfoCard.vue';
import SystemRuntimeInfoCard from './components/SystemRuntimeInfoCard.vue';
import SystemServerInfoCard from './components/SystemServerInfoCard.vue';
import { createEmptySystemInfo, type SystemInfo } from './systemInfo';
import { getSystemInfo } from '@/api/monitor/system';
import { isSuccess } from '@/plugins/httpFetch';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const systemInfo = ref<SystemInfo>(createEmptySystemInfo());
const loading = ref(false);

/** 加载服务器信息，并用空结构补齐缺失字段供子组件稳定渲染 */
async function loadSystemInfo() {
  loading.value = true;
  try {
    const res = await getSystemInfo();
    if (isSuccess(res) && res.data) {
      systemInfo.value = {
        ...createEmptySystemInfo(),
        ...res.data,
      };
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadSystemInfo);
</script>

<template>
  <PageContainer :title="title" :loading="loading">
    <template #content>
      <a-typography-paragraph> 服务器与应用程序的信息 </a-typography-paragraph>
    </template>

    <SystemProjectInfoCard :project="systemInfo.project" />
    <SystemServerInfoCard :system="systemInfo.system" />
    <SystemResourceInfoCard :cpu="systemInfo.cpu" :memory="systemInfo.memory" />
    <SystemRuntimeInfoCard
      :time="systemInfo.time"
      :network="systemInfo.network"
    />
    <SystemDiskTable :disks="systemInfo.disk" />
  </PageContainer>
</template>
