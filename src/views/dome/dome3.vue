<template>
  <PageContainer
    title="Title"
    sub-title="show current project dependencies"
    :avatar="{
      src: 'https://gw.alipayobjects.com/zos/antfincdn/K%24NnlsB%26hz/pageHeader.svg',
    }"
    @back="() => $router.go(-1)"
    :ghost="false"
    :flex="true"
    :loading="loading"
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
      <p v-for="i in list" :key="i">
        text block...
        <a-tag>{{ i }}</a-tag>
      </p>
    </a-card>
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';

const list = ref<number>(50);

const loading = ref<boolean>(true);
setTimeout(() => {
  loading.value = false;
}, 1200);
</script>
