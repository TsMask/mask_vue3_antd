<template>
  <PageContainer title="Version" sub-title="show current project dependencies">
    <template #content>
      <strong>Content Area</strong>
    </template>
    <template #extra>
      <strong>Extra Area</strong>
    </template>
    <template #extraContent>
      <strong>ExtraContent Area</strong>
    </template>
    <template #tags>
      <a-tag>Tag1</a-tag>
      <a-tag color="pink">Tag2</a-tag>
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
import { PageContainer } from '@ant-design-vue/pro-layout';

const list = ref<number>(50);
</script>
