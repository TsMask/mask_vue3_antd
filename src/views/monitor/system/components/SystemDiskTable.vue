<script setup lang="ts">
import type { ColumnsType } from 'ant-design-vue/es/table';
import type { SystemDiskInfo } from '../types';

defineProps<{
  disks: SystemDiskInfo[];
}>();

const diskColumns: ColumnsType = [
  { title: '路径盘符', dataIndex: 'target', align: 'left' },
  { title: '总大小', dataIndex: 'size', align: 'left' },
  { title: '剩余大小', dataIndex: 'avail', align: 'left' },
  { title: '已使用大小', dataIndex: 'used', align: 'left' },
  { title: '空间使用率(%)', dataIndex: 'percent', align: 'left' },
];
</script>

<template>
  <a-card title="磁盘信息" :bordered="false" :body-style="{ padding: 0 }">
    <a-table
      row-key="target"
      size="middle"
      :columns="diskColumns"
      :data-source="disks"
      :pagination="false"
      :scroll="{ x: true }"
    />
  </a-card>
</template>
