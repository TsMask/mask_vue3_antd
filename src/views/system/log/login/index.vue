<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import LoginLogTable from './components/LoginLogTable.vue';
import {
  cleanSysLogLogin,
  exportSysLogLogin,
  listSysLogLogin,
} from '@/api/system/log/login';
import { saveAs } from 'file-saver';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable } from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const { confirmAction } = useModalAction();

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
  queryFn: listSysLogLogin,
  defaultPageSize: 20,
});

/** 清空全部登录日志，作用范围不受当前查询条件限制 */
function handleCleanList() {
  confirmAction({
    content: '确认清空所有登录日志数据项?',
    action: () => cleanSysLogLogin(),
    successText: '清空成功',
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () =>
      exportSysLogLogin({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `sys_log_login_${Date.now()}.csv`);
    },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        对登录进行日志收集，登录锁定的信息存入
        <a-typography-text code>Redis</a-typography-text>
        可对登录账号进行解锁。
      </a-typography-paragraph>
    </template>

    <LoginLogTable
      :loading="loading"
      :data-source="dataSource"
      :pagination="pagination"
      @search="onSearch"
      @reset="onReset"
      @change="onTableChange"
      @reload="reload"
      @clean="handleCleanList"
      @export="handleExport"
    />
  </PageContainer>
</template>
