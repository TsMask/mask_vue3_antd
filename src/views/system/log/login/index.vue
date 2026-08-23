<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import {
  exportSysLogLogin,
  listSysLogLogin,
  cleanSysLogLogin,
} from '@/api/system/log/login';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';
import { confirmAction } from '@/hooks/useAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

const { dict } = useDictSetup({
  keyMap: { sysCommonStatus: 'sys_common_status' },
});

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
    valueEnum: toProValueEnum(dict.sysCommonStatus),
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
    valueEnum: toProValueEnum(dict.sysCommonStatus),
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

function handleCleanList() {
  confirmAction({
    content: '确认清空所有登录日志数据项?',
    action: () => cleanSysLogLogin(),
    variables: undefined as any,
    successText: '清空成功',
  });
}

/** 导出使用搜索表单转换后的接口参数 */
function buildExportParams() {
  return {
    ...toRaw(searchValues.value),
    page_num: current.value,
    page_size: pageSize.value,
  };
}

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () => exportSysLogLogin(buildExportParams()),
    variables: undefined as any,
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

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @change="onTableChange"
      :scroll="tableScroll"
      :search="{
        columns: searchColumns,
        labelWidth: 100,
        labelWrap: true,
        onSearch,
        onReset,
      }"
      :toolbar="{
        setting: {
          columnsStateKey: 'system-log-login',
          columnsStateType: 'local',
        },
        onReload: reload,
      }"
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
            @click.prevent="handleCleanList()"
            v-perms:has="['system:log:login:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
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
          <DictTag
            :options="dict.sysCommonStatus"
            :value="record.login_status"
          />
        </template>
      </template>
    </ProTable>
  </PageContainer>
</template>

<style scoped></style>
