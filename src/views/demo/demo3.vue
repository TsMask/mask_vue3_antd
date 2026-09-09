<template>
  <PageContainer
    title="Title"
    sub-title="show current project dependencies"
    :avatar="{
      src: 'https://gw.alipayobjects.com/zos/antfincdn/K%24NnlsB%26hz/pageHeader.svg',
    }"
    :ghost="false"
    :flex="true"
    :loading="loading"
    @back="handleBack"
  >
    <template #extra>
      <strong>Extra Area</strong>
    </template>
    <template #tags>
      <a-tag>Tag1</a-tag>
      <a-tag color="pink">Tag2</a-tag>
    </template>
    <template #content>
      <strong>Content Area</strong>
    </template>
    <template #contentExtra>
      <strong>ContentExtra Area</strong>
    </template>

    <a-card title="Info">
      <p v-for="item in itemCount" :key="item">
        text block...
        <a-tag>{{ item }}</a-tag>
      </p>
    </a-card>
  </PageContainer>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { useRouter } from 'vue-router';

const router = useRouter();
const itemCount = 50;
const loading = ref(true);
let loadingTimeout: ReturnType<typeof setTimeout> | undefined;

function handleBack() {
  router.back();
}

onMounted(() => {
  loadingTimeout = setTimeout(() => {
    loading.value = false;
  }, 1200);
});

onBeforeUnmount(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = undefined;
  }
});
</script>
