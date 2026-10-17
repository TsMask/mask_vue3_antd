<script setup lang="ts">
import type { SystemInfoRecord } from '../systemInfo';

defineProps<{
  time: SystemInfoRecord;
  network: Record<string, string>;
}>();
</script>

<template>
  <a-card
    title="时间信息"
    variant="borderless"
    :styles="{ body: { marginBottom: '24px', padding: 0 } }"
  >
    <a-descriptions
      size="middle"
      layout="horizontal"
      :label-style="{ width: '140px' }"
      :column="{ lg: 3, md: 3, xs: 1 }"
      :bordered="true"
    >
      <a-descriptions-item label="时间">
        {{ time.current || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="时区">
        {{ time.timezone || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="时区名称">
        {{ time.timezone_name || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>

  <a-card
    title="网络信息"
    variant="borderless"
    :styles="{ body: { marginBottom: '24px', padding: 0 } }"
  >
    <a-descriptions
      size="middle"
      layout="horizontal"
      :label-style="{ width: '140px' }"
      :column="1"
      :bordered="true"
    >
      <a-descriptions-item
        v-for="(value, name) in network"
        :key="name"
        :label="name"
      >
        {{ value || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
