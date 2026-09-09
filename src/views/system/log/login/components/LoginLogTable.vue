<script setup lang="ts">
import { computed } from 'vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';
import { toProValueEnum, useProTableScroll } from '@/hooks/useProTable';

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
  clean: [];
  export: [];
}>();

const { dict } = useDictSetup({
  keyMap: { sysSuccessFail: 'sys_success_fail' },
});

const tableColumns = computed<ProColumns[]>(() => [
  { title: '日志编号', dataIndex: 'id', align: 'left', width: 100 },
  {
    title: '登录账号',
    dataIndex: 'login_user_name',
    align: 'left',
    width: 150,
    sorter: true,
  },
  {
    title: '登录IP',
    dataIndex: 'login_ip',
    align: 'left',
    width: 150,
    fieldProps: { maxlength: 128 },
  },
  { title: '登录地点', dataIndex: 'login_location', align: 'left', width: 150 },
  { title: '操作系统', dataIndex: 'login_os', align: 'left', width: 150 },
  { title: '浏览器', dataIndex: 'login_browser', align: 'left', width: 200 },
  {
    title: '登录状态',
    dataIndex: 'login_status',
    key: 'login_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '登录时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 150,
    sorter: true,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  { title: '登录信息', dataIndex: 'login_msg', align: 'left', ellipsis: true },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '登录账号', dataIndex: 'login_user_name' },
  { title: '登录IP', dataIndex: 'login_ip', fieldProps: { maxlength: 128 } },
  {
    title: '登录状态',
    dataIndex: 'login_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '登录时间范围',
    dataIndex: 'create_time',
    valueType: 'dateTimeRange',
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        create_time_begin: value?.[0]?.valueOf(),
        create_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

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
    row-key="id"
    :columns="tableColumns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="pagination"
    :scroll="tableScroll"
    :search="{
      columns: searchColumns,
      labelWidth: 100,
      labelWrap: true,
      onSearch: handleSearch,
      onReset: handleReset,
    }"
    :toolbar="{
      setting: {
        columnsStateKey: 'system-log-login',
        columnsStateType: 'local',
      },
      onReload: handleReload,
    }"
    @change="handleTableChange"
  >
    <template #toolBarRender>
      <a-space
        :size="8"
        align="center"
        :style="{ flexWrap: 'wrap', marginBottom: '8px' }"
      >
        <a-button
          type="dashed"
          danger
          @click.prevent="emit('clean')"
          v-perms:has="['system:log:login:remove']"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
        <a-button
          type="dashed"
          @click.prevent="emit('export')"
          v-perms:has="['system:log:login:export']"
        >
          <template #icon>
            <ExportOutlined />
          </template>
          导出
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'login_status'">
        <DictTag :options="dict.sysSuccessFail" :value="record.login_status" />
      </template>
    </template>
  </ProTable>
</template>
