<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import JobLogDetailModal from './components/JobLogDetailModal.vue';
import JobLogTable from './components/JobLogTable.vue';
import {
  cleanJobLog,
  delJobLog,
  exportJobLog,
  listJobLog,
} from '@/api/monitor/jobLog';
import { saveAs } from 'file-saver';
import { useTabsView } from '@/layouts/hooks/useTabsView';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable } from '@/hooks/useProTable';

const { closeTab } = useTabsView();
const route = useRoute();
const router = useRouter();
const routeJobId = Number(route.params.jobId as string) || 0;
const { confirmAction } = useModalAction();
const jobLogDetailModal = ref<InstanceType<typeof JobLogDetailModal> | null>(
  null
);

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
  rowSelection,
  selectedRowKeys,
  removeSelectedRowKeys,
} = useProTable({
  queryFn: listJobLog,
  params: () => ({ id: routeJobId }),
  defaultPageSize: 20,
  rowKey: 'id',
});

function handleView(row: Record<string, any>) {
  jobLogDetailModal.value?.openView(row);
}

/** 批量删除选中日志，成功后清理选择并回到有效分页 */
function handleDeleteSelected() {
  const ids = selectedRowKeys.value.join(',');
  confirmAction({
    content: `确认删除调度日志编号为 【${ids}】 的数据项吗?`,
    action: () => delJobLog(ids),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(ids).split(',').map(Number));
      reload();
    },
  });
}

/** 清空任务日志属于全局破坏性操作，先记录原选择便于成功后统一清理 */
function handleCleanAll() {
  const selectedKeys = [...selectedRowKeys.value];
  confirmAction({
    content: '确认清空所有调度日志数据项吗?',
    action: () => cleanJobLog(),
    successText: '清空成功',
    onSuccess() {
      removeSelectedRowKeys(selectedKeys);
      reload();
    },
  });
}

/** 导出保持当前任务、搜索条件和分页范围 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () =>
      exportJobLog({
        id: routeJobId,
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已完成导出',
    onSuccess: res => {
      saveAs(res.data, `job_log_${Date.now()}.csv`);
    },
  });
}

/** 优先跳到页签关闭逻辑给出的目标页，无目标时回退历史 */
function handleClose() {
  const to = closeTab(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}
</script>

<template>
  <PageContainer>
    <JobLogTable
      :loading="loading"
      :data-source="dataSource"
      :pagination="pagination"
      :row-selection="rowSelection"
      :selected-row-keys="selectedRowKeys"
      @search="onSearch"
      @reset="onReset"
      @change="onTableChange"
      @reload="reload"
      @close="handleClose"
      @delete-selected="handleDeleteSelected"
      @clean="handleCleanAll"
      @export="handleExport"
      @view="handleView"
    />
    <JobLogDetailModal ref="jobLogDetailModal" />
  </PageContainer>
</template>
