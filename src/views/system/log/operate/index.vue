<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import OperateLogDetailModal from './components/OperateLogDetailModal.vue';
import OperateLogTable from './components/OperateLogTable.vue';
import {
  cleanSysLogOperate,
  exportSysLogOperate,
  listSysLogOperate,
} from '@/api/system/log/operate';
import { saveAs } from 'file-saver';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable } from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const { confirmAction } = useModalAction();
const operateLogDetailModal = ref<InstanceType<
  typeof OperateLogDetailModal
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
  queryFn: listSysLogOperate,
  defaultPageSize: 20,
});

function handleView(row: Record<string, any>) {
  operateLogDetailModal.value?.openView(row);
}

/** 清空全部操作日志，作用范围不受当前查询条件限制 */
function handleCleanList() {
  confirmAction({
    content: '确认清空所有操作日志数据项?',
    action: () => cleanSysLogOperate(),
    successText: '清空成功',
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () =>
      exportSysLogOperate({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `sys_log_operate_${Date.now()}.csv`);
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

    <OperateLogTable
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
    <OperateLogDetailModal ref="operateLogDetailModal" />
  </PageContainer>
</template>
