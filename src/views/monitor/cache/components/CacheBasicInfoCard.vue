<script setup lang="ts">
import type { CacheOverview } from '../types';

defineProps<{
  cache: CacheOverview;
}>();
</script>

<template>
  <a-card
    title="基本信息"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
  >
    <a-descriptions
      size="middle"
      layout="horizontal"
      :label-style="{ width: '140px' }"
      :bordered="true"
      :column="{ lg: 4, md: 2, xs: 1 }"
    >
      <a-descriptions-item label="Redis版本">
        {{ cache.info.server.redis_version }}
      </a-descriptions-item>
      <a-descriptions-item label="运行模式">
        {{ cache.info.server.redis_mode === 'standalone' ? '单机' : '集群' }}
      </a-descriptions-item>
      <a-descriptions-item label="端口">
        {{ cache.info.server.tcp_port }}
      </a-descriptions-item>
      <a-descriptions-item label="客户端数">
        {{ cache.info.clients.connected_clients }}
      </a-descriptions-item>
      <a-descriptions-item label="运行时间(天)">
        {{ cache.info.server.uptime_in_days }}
      </a-descriptions-item>
      <a-descriptions-item label="使用内存">
        {{ cache.info.memory.used_memory_human }}
      </a-descriptions-item>
      <a-descriptions-item label="使用CPU">
        {{ parseFloat(cache.info.cpu.used_cpu_user_children).toFixed(2) }}
      </a-descriptions-item>
      <a-descriptions-item label="内存配置">
        {{ cache.info.memory.maxmemory_human }}
      </a-descriptions-item>
      <a-descriptions-item label="AOF是否开启">
        {{ cache.info.persistence.aof_enabled === '0' ? '否' : '是' }}
      </a-descriptions-item>
      <a-descriptions-item label="RDB是否成功">
        {{ cache.info.persistence.rdb_last_bgsave_status }}
      </a-descriptions-item>
      <a-descriptions-item label="Key数量">
        {{ cache.db_size }}
      </a-descriptions-item>
      <a-descriptions-item label="网络入口/出口">
        {{ cache.info.stats.instantaneous_input_kbps }} kps /
        {{ cache.info.stats.instantaneous_output_kbps }} kps
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
