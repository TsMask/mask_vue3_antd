<script setup lang="ts">
import type { SystemInfoRecord } from '../systemInfo';

defineProps<{
  system: SystemInfoRecord;
}>();

/** 运行时长支持后端返回秒数或已格式化文本。 */
function formatUptime(uptime?: string | number) {
  if (typeof uptime === 'string') return uptime || '-';
  if (uptime === undefined || uptime <= 0) return '-';

  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  const parts: string[] = [];
  if (days !== 0) parts.push(`${days}天`);
  if (hours !== 0) parts.push(`${hours}小时`);
  if (minutes !== 0) parts.push(`${minutes}分钟`);
  parts.push(`${seconds}秒`);
  return parts.join(' ');
}
</script>

<template>
  <a-card
    title="系统信息"
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
      <a-descriptions-item label="系统平台">
        {{ system.platform || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="平台版本">
        {{ system.platform_version || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="系统OS">
        {{ system.os || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="系统架构">
        {{ system.arch || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="架构版本">
        {{ system.arch_version || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="系统运行">
        {{ formatUptime(system.boot_time) }}
      </a-descriptions-item>
      <a-descriptions-item label="程序环境">
        {{ system.run_version || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="程序架构">
        {{ system.run_arch || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="程序运行">
        {{ formatUptime(system.run_time) }}
      </a-descriptions-item>
      <a-descriptions-item label="主机名称">
        {{ system.hostname || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="主机用户目录">
        {{ system.home_dir || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="程序PID">
        {{ system.process_id || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="项目路径" :span="3">
        {{ system.cmd || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="执行命令" :span="3">
        {{ system.exec_command || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
