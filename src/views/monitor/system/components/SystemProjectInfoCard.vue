<script setup lang="ts">
import type { SystemProjectInfo } from '../types';

defineProps<{
  project: SystemProjectInfo;
}>();
</script>

<template>
  <a-card
    title="项目信息"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
  >
    <a-descriptions
      size="middle"
      layout="horizontal"
      :label-style="{ width: '140px' }"
      :bordered="true"
      :column="{ lg: 2, md: 2, xs: 1 }"
    >
      <a-descriptions-item label="项目名称">
        {{ project.name || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="项目版本">
        {{ project.version || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="项目环境">
        {{ project.env || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="项目路径">
        {{ project.app_dir || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
