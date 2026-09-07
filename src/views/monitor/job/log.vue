<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, reactive, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import {
  exportJobLog,
  listJobLog,
  delJobLog,
  cleanJobLog,
} from '@/api/monitor/jobLog';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import { useTabsView } from '@/layouts/hooks/useTabsView';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const { confirmAction } = useModalAction();

const { closeTab } = useTabsView();
const route = useRoute();
const router = useRouter();
/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: {
    sysJobGroup: 'sys_job_group',
    sysSuccessFail: 'sys_success_fail',
  },
});

/** 列表数据查询 */
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
  params: () => ({ id: (route.params.jobId as string) || '' }),
  defaultPageSize: 20,
  rowKey: 'id',
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

/** 详情弹窗状态 */
const detailVisible = ref(false);
const detailTitle = ref('任务日志');
const detailForm = reactive({
  id: undefined as string | number | undefined,
  job_name: '',
  job_group: 'DEFAULT',
  job_invoke_target: '',
  job_target_params: '',
  log_status: '0',
  log_msg: '',
  log_cost_time: 0,
  create_time: 0,
});

function handleViewDetail(row: Record<string, string>) {
  Object.assign(detailForm, row);
  detailTitle.value = '调度日志信息';
  detailVisible.value = true;
}

function handleCloseDetail() {
  detailVisible.value = false;
}

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

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () => {
      return exportJobLog({
        id: (route.params.jobId as string) || '',
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    successText: '已完成导出',
    onSuccess: res => saveAs(res.data, `job_log_${Date.now()}.csv`),
  });
}

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
    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
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
          columnsStateKey: 'monitor-job-log',
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
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon>
              <CloseOutlined />
            </template>
            关闭
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleDeleteSelected()"
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
            @click.prevent="handleCleanAll()"
            v-perms:has="['job:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
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
                @click.prevent="handleViewDetail(record)"
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

    <!-- 详情框 -->
    <ProModal
      :drag="true"
      :width="800"
      :open="detailVisible"
      :title="detailTitle"
      @cancel="handleCloseDetail"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="日志编号" name="id">{{
              detailForm.id
            }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="log_status">
              <DictTag
                :options="dict.sysSuccessFail"
                :value="detailForm.log_status"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务名称" name="job_name">{{
              detailForm.job_name
            }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="job_group">
              <DictTag
                :options="dict.sysJobGroup"
                :value="detailForm.job_group"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="job_invoke_target">{{
              detailForm.job_invoke_target
            }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录时间" name="create_time">
              <span v-if="+detailForm.create_time > 0">{{
                parseDateToStr(+detailForm.create_time)
              }}</span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="消耗时间" name="log_cost_time">
              {{ detailForm.log_cost_time ?? 0 }} ms
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="传入参数"
          name="job_target_params"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="
              JSON.stringify(JSON.parse(detailForm.job_target_params), null, 2)
            "
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>
        <a-form-item
          label="日志信息"
          name="log_msg"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="JSON.stringify(JSON.parse(detailForm.log_msg), null, 2)"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCloseDetail">关闭</a-button>
      </template>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
