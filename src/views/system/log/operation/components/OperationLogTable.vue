<script setup lang="ts">
import { computed } from 'vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import { parseDateToStr } from '@/utils/date';
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
  view: [row: Record<string, any>];
}>();

const { dict } = useDictSetup({
  keyMap: {
    sysOperationType: 'sys_operation_type',
    sysSuccessFail: 'sys_success_fail',
  },
});

const tableColumns = computed<ProColumns[]>(() => [
  { title: '日志编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '系统模块', dataIndex: 'title', align: 'left', width: 150 },
  {
    title: '操作类型',
    dataIndex: 'operation_type',
    key: 'operation_type',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysOperationType),
  },
  { title: '操作人员', dataIndex: 'create_by', align: 'left', width: 100 },
  { title: '操作地址', dataIndex: 'operation_ip', align: 'left', width: 150 },
  {
    title: '操作状态',
    dataIndex: 'operation_status',
    key: 'operation_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '操作时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 150,
    sorter: true,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 130,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '系统模块', dataIndex: 'title' },
  {
    title: '操作类型',
    dataIndex: 'operation_type',
    valueType: 'select',
    fieldProps: { mode: 'multiple', placeholder: '请选择操作类型' },
    valueEnum: toProValueEnum(dict.sysOperationType),
    searchTransform(value: string[]) {
      return { operation_type: value.join(',') };
    },
  },
  { title: '操作人员', dataIndex: 'create_by' },
  { title: '操作地址', dataIndex: 'operation_ip' },
  {
    title: '操作状态',
    dataIndex: 'operation_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '操作时间范围',
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
        columnsStateKey: 'system-log-operation',
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
          v-perms:has="['system:operation:log:remove']"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
        <a-button
          type="dashed"
          @click.prevent="emit('export')"
          v-perms:has="['system:operation:log:export']"
        >
          <template #icon>
            <ExportOutlined />
          </template>
          导出
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'operation_type'">
        <DictTag :options="dict.sysOperationType" :value="record.operation_type" />
      </template>
      <template v-if="column.key === 'operation_status'">
        <DictTag
          :options="dict.sysSuccessFail"
          :value="record.operation_status"
        />
      </template>
      <template v-if="column.key === 'operation'">
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>查看详情</template>
            <a-button
              type="link"
              @click.prevent="emit('view', record)"
              v-perms:has="['system:operation:log:list']"
            >
              <template #icon>
                <ProfileOutlined />
              </template>
              详情
            </a-button>
          </a-tooltip>
        </a-space>
      </template>
    </template>
  </ProTable>
</template>
