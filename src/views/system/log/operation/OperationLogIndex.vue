<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import OperationLogDetailModal from './components/OperationLogDetailModal.vue';
import OperationLogTable from './components/OperationLogTable.vue';
import {
  cleanSysOperationLog,
  exportSysOperationLog,
  listSysOperationLog,
} from '@/api/system/log/operation';
import { saveAs } from 'file-saver';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable } from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const { confirmAction } = useModalAction();
const operationLogDetailModal = ref<InstanceType<
  typeof OperationLogDetailModal
> | null>(null);

const {
  dataSource,
  loading,
  pagination,
  current,
  pageSize,
  searchValues,
  onSearch,
  onReset,
  onTableChange,
  reload,
} = useProTable({
  queryFn: listSysOperationLog,
  defaultPageSize: 20,
});

function handleView(row: Record<string, any>) {
  operationLogDetailModal.value?.openView(row);
}

/** 清空全部操作日志，作用范围不受当前查询条件限制 */
function handleCleanList() {
  confirmAction({
    content: '确认清空所有操作日志数据项?',
    action: () => cleanSysOperationLog(),
    successText: '清空成功',
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () =>
      exportSysOperationLog({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `sys_operation_log_${Date.now()}.csv`);
    },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        对接口请求进行日志收集，统计高频接口分析优化等操作。
      </a-typography-paragraph>
    </template>

    <OperationLogTable
      :loading="loading"
      :data-source="dataSource"
      :pagination="pagination"
      @search="onSearch"
      @reset="onReset"
      @change="onTableChange"
      @reload="reload"
      @clean="handleCleanList"
      @export="handleExport"
      @view="handleView"
    />
    <OperationLogDetailModal ref="operationLogDetailModal" />
  </PageContainer>
</template>
