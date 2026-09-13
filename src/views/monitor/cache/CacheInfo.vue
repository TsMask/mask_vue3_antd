<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { PageContainer } from 'antdv-pro-layout';
import CacheBasicInfoCard from './components/CacheBasicInfoCard.vue';
import CacheCommandStatsChart from './components/CacheCommandStatsChart.vue';
import type { CacheOverview } from './cacheInfo';
import { getCache } from '@/api/monitor/cache';
import { isSuccess } from '@/plugins/httpFetch';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const cache = ref<CacheOverview>();
const loading = ref(false);

/** 加载 Redis 概览，接口异常时保留上一次可读数据 */
async function loadCache() {
  loading.value = true;
  try {
    const res = await getCache();
    if (isSuccess(res)) cache.value = res.data as CacheOverview;
  } finally {
    loading.value = false;
  }
}

onMounted(loadCache);
</script>

<template>
  <PageContainer :title="title" :loading="loading">
    <template #content>
      <a-typography-paragraph>
        缓存
        <a-typography-text code>Redis</a-typography-text>
        应用程序的信息
      </a-typography-paragraph>
    </template>

    <template v-if="cache">
      <CacheBasicInfoCard :cache="cache" />
      <CacheCommandStatsChart :stats="cache.command_stats" />
    </template>
  </PageContainer>
</template>
