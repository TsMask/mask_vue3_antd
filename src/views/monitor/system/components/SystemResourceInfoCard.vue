<script setup lang="ts">
import type { SystemCpuInfo, SystemInfoRecord } from '../types';

defineProps<{
  cpu: SystemCpuInfo;
  memory: SystemInfoRecord;
}>();

/** 后端可能按 CPU 核心返回使用率数组，展示时合并为单行。 */
function formatCoreUsed(value?: string | number | string[]) {
  if (Array.isArray(value)) return value.join(' / ') || '-';
  if (value === undefined || value === '') return '-';
  return value;
}
</script>

<template>
  <a-card
    title="CPU信息"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
  >
    <a-descriptions
      size="middle"
      layout="horizontal"
      :label-style="{ width: '140px' }"
      :column="1"
      :bordered="true"
    >
      <a-descriptions-item label="型号">
        {{ cpu.model || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="速率Hz">
        {{ cpu.speed || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="核心数">
        {{ cpu.core || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="使用率(%)">
        {{ formatCoreUsed(cpu.core_used) }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>

  <a-card
    title="内存信息"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
  >
    <a-descriptions
      size="middle"
      layout="horizontal"
      :label-style="{ width: '140px' }"
      :column="{ lg: 2, md: 2, xs: 1 }"
      :bordered="true"
    >
      <a-descriptions-item label="总内存">
        {{ memory.totalmem || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="剩余内存">
        {{ memory.freemem || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="使用率(%)">
        {{ memory.usage || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="进程总内存">
        {{ memory.rss || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="堆的总大小">
        {{ memory.heap_total || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="堆已分配">
        {{ memory.heap_used || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="链接库占用">
        {{ memory.external || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
