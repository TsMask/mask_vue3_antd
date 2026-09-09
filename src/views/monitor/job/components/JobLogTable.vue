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
  rowSelection: Record<string, any>;
  selectedRowKeys: Array<string | number>;
}>();

const emit = defineEmits<{
  search: [values: Record<string, any>];
  reset: [];
  change: [pagination: any, filters: any, sorter: any];
  reload: [];
  close: [];
  deleteSelected: [];
  clean: [];
  export: [];
  view: [row: Record<string, any>];
}>();

const { dict } = useDictSetup({
  keyMap: {
    sysJobGroup: 'sys_job_group',
    sysSuccessFail: 'sys_success_fail',
  },
});

const tableColumns = computed<ProColumns[]>(() => [
  {
    title: '日志编号',
    dataIndex: 'id',
    align: 'left',
    width: 90,
    sorter: true,
  },
  {
    title: '任务名称',
    dataIndex: 'job_name',
    align: 'left',
    width: 180,
    sorter: true,
    ellipsis: true,
  },
  {
    title: '调用目标',
    dataIndex: 'job_invoke_target',
    align: 'left',
    width: 140,
    sorter: true,
    ellipsis: true,
  },
  {
    title: '任务组名',
    dataIndex: 'job_group',
    key: 'job_group',
    align: 'left',
    width: 100,
    sorter: true,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysJobGroup),
  },
  {
    title: '执行状态',
    dataIndex: 'log_status',
    key: 'log_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '记录时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 160,
    sorter: true,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '消耗时间',
    dataIndex: 'log_cost_time',
    key: 'log_cost_time',
    align: 'right',
    width: 100,
    renderText: value => `${Number(value) || 0} ms`,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 100,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  {
    title: '执行状态',
    dataIndex: 'log_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '记录时间范围',
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
    :row-selection="rowSelection"
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
        columnsStateKey: 'monitor-job-log',
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
        <a-button type="default" @click.prevent="emit('close')">
          <template #icon>
            <CloseOutlined />
          </template>
          关闭
        </a-button>
        <a-button
          type="default"
          danger
          :disabled="selectedRowKeys.length <= 0"
          @click.prevent="emit('deleteSelected')"
          v-perms:has="['job:remove']"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          删除
        </a-button>
        <a-button
          type="dashed"
          danger
          @click.prevent="emit('clean')"
          v-perms:has="['job:remove']"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
        <a-button
          type="dashed"
          @click.prevent="emit('export')"
          v-perms:has="['job:export']"
        >
          <template #icon>
            <ExportOutlined />
          </template>
          导出
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'job_group'">
        <DictTag :options="dict.sysJobGroup" :value="record.job_group" />
      </template>
      <template v-if="column.key === 'log_status'">
        <DictTag :options="dict.sysSuccessFail" :value="record.log_status" />
      </template>
      <template v-if="column.key === 'operation'">
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>查看详情</template>
            <a-button
              type="link"
              @click.prevent="emit('view', record)"
              v-perms:has="['job:query']"
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
