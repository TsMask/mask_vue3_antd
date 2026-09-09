<script setup lang="ts">
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import { parseDateToStr } from '@/utils/date-utils';
import { useProTableScroll } from '@/hooks/useProTable';

defineProps<{
  loading: boolean;
  dataSource: Record<string, any>[];
  pagination: Record<string, any>;
}>();

const emit = defineEmits<{
  search: [values: Record<string, any>];
  reset: [];
  change: [pagination: any, filters: any, sorter: any];
  reload: [];
  forceLogout: [row: Record<string, any>];
}>();

const tableColumns: ProColumns[] = [
  {
    title: '序号',
    valueType: 'index',
    width: 50,
    align: 'left',
    fixed: 'left',
  },
  {
    title: '登录账号',
    dataIndex: 'user_name',
    align: 'left',
    width: 150,
    sorter: true,
    fixed: 'left',
  },
  { title: '角色', dataIndex: 'role_keys', align: 'left', width: 120 },
  { title: '登录IP', dataIndex: 'login_ip', align: 'left', width: 120 },
  { title: '登录地点', dataIndex: 'login_location', align: 'left', width: 120 },
  { title: '操作系统', dataIndex: 'login_os', align: 'left', width: 120 },
  { title: '浏览器', dataIndex: 'login_browser', align: 'left', width: 200 },
  {
    title: '登录时间',
    dataIndex: 'login_time',
    align: 'left',
    width: 150,
    sorter: true,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '会话编号',
    dataIndex: 'session_id',
    align: 'left',
    width: 260,
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 90,
    fixed: 'right',
  },
];

const searchColumns: ProColumnsSearch[] = [
  { title: '登录账号', dataIndex: 'user_name', fieldProps: { maxlength: 30 } },
  { title: '登录IP', dataIndex: 'login_ip', fieldProps: { maxlength: 128 } },
];

const tableScroll = useProTableScroll(tableColumns);

function handleSearch(values: Record<string, any>) {
  emit('search', values);
}

function handleReset() {
  emit('reset');
}

function handleTableChange(pagination: any, filters: any, sorter: any) {
  emit('change', pagination, filters, sorter);
}

function handleReload() {
  emit('reload');
}
</script>

<template>
  <ProTable
    row-key="session_id"
    :columns="tableColumns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="pagination"
    :scroll="tableScroll"
    :search="{
      columns: searchColumns,
      onSearch: handleSearch,
      onReset: handleReset,
    }"
    :toolbar="{
      setting: {
        columnsStateKey: 'monitor-online',
        columnsStateType: 'local',
      },
      onReload: handleReload,
    }"
    @change="handleTableChange"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'role_keys'">
        <a-space :size="4" :wrap="true">
          <a-tag v-for="role in record.role_keys ?? []" :key="role">
            {{ role }}
          </a-tag>
          <span v-if="!record.role_keys?.length">-</span>
        </a-space>
      </template>
      <template v-if="column.dataIndex === 'login_time'">
        <span>
          {{ +record.login_time > 0 ? parseDateToStr(+record.login_time) : '' }}
        </span>
      </template>
      <template v-if="column.dataIndex === 'session_id'">
        <a-typography-text
          class="identifier-text"
          :content="record.session_id"
          :copyable="{ text: record.session_id }"
          :ellipsis="true"
        />
      </template>
      <template v-if="column.key === 'operation'">
        <a-button
          type="link"
          danger
          @click.prevent="emit('forceLogout', record)"
          v-perms:has="['monitor:online:logout']"
        >
          <template #icon>
            <LogoutOutlined />
          </template>
          强退
        </a-button>
      </template>
    </template>
  </ProTable>
</template>

<style scoped>
.identifier-text {
  max-width: 100%;
}
</style>
