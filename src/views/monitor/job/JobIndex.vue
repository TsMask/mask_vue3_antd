<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import JobFormModal from './components/JobFormModal.vue';
import {
  exportJob,
  listJob,
  delJob,
  runJob,
  changeStatus,
  resetJob,
} from '@/api/monitor/job';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date';
import { hasPermissions } from '@/utils/authAccess';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const router = useRouter();
const title = ref<string>(route.meta.title ?? '标题');

/** 列表与查询使用的任务字典；表单弹窗复用同一份字典缓存。 */
const { dict } = useDictSetup({
  keyMap: {
    sysJobGroup: 'sys_job_group',
    jobStatus: [
      { label: '正常', value: '1' },
      { label: '暂停', value: '0' },
    ],
    jobSaveLog: [
      { label: '记录', value: '1' },
      { label: '不记录', value: '0' },
    ],
    jobMisfirePolicy: [
      { label: '立即执行', value: '1' },
      { label: '执行一次', value: '2' },
      { label: '放弃执行', value: '3' },
    ],
    jobConcurrent: [
      { label: '允许', value: '1' },
      { label: '禁止', value: '0' },
    ],
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
  queryFn: listJob,
  defaultPageSize: 20,
  rowKey: 'id',
});

const { confirmAction } = useModalAction();
const jobFormModal = ref<InstanceType<typeof JobFormModal> | null>(null);

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  {
    title: '任务编号',
    dataIndex: 'id',
    align: 'left',
    width: 90,
    sorter: true,
    fixed: 'left',
  },
  {
    title: '任务名称',
    dataIndex: 'job_name',
    align: 'left',
    width: 180,
    sorter: true,
    ellipsis: true,
    fixed: 'left',
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
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysJobGroup),
  },
  {
    title: 'Cron表达式',
    dataIndex: 'job_cron',
    align: 'left',
    width: 140,
    sorter: true,
    ellipsis: true,
  },
  {
    title: '出错策略',
    dataIndex: 'job_misfire_policy',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.jobMisfirePolicy),
  },
  {
    title: '并发',
    dataIndex: 'job_concurrent',
    align: 'left',
    width: 80,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.jobConcurrent),
  },
  {
    title: '状态',
    dataIndex: 'job_status',
    key: 'job_status',
    align: 'left',
    width: 120,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.jobStatus),
  },
  {
    title: '记录日志',
    dataIndex: 'job_save_log',
    key: 'job_save_log',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.jobSaveLog),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 160,
    sorter: true,
    renderText: value => (+value > 0 ? parseDateToStr(+value) : '-'),
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 210,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

/** 查询字段 */
const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '任务名称', dataIndex: 'job_name' },
  {
    title: '任务组名',
    dataIndex: 'job_group',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysJobGroup),
  },
  {
    title: '状态',
    dataIndex: 'job_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.jobStatus),
  },
]);

/** 切换任务启停后只替换当前行状态，避免整表刷新打断操作位置 */
function handleStatusChange(row: Record<string, string>) {
  const nextStatus = row.job_status === '1' ? '0' : '1';
  const text =
    dict.jobStatus.find(item => item.value === nextStatus)?.label ?? nextStatus;
  confirmAction({
    content: `确定要${text} 【${row.job_name}】 任务吗?`,
    action: () => changeStatus(row.id, nextStatus),
    successText: `${row.job_name} ${text}成功`,
    onSuccess() {
      dataSource.value = dataSource.value.map(item =>
        String(item.id) === String(row.id)
          ? { ...item, job_status: nextStatus }
          : item
      );
    },
  });
}

/** 不修改调度配置，仅手动触发一次任务执行 */
function handleRunOnce(row: Record<string, string>) {
  confirmAction({
    content: `确定要立即执行一次 【${row.job_name}】 任务吗?`,
    action: () => runJob(row.id),
    successText: `${row.job_name} 执行成功`,
  });
}

/** 支持行内删除和批量删除，默认 0 表示使用当前选中行 */
function handleDelete(id: string = '0') {
  const jobId = id === '0' ? selectedRowKeys.value.join(',') : id;
  confirmAction({
    content: `确认删除定时任务编号为 【${jobId}】 任务吗?`,
    action: () => delJob(jobId),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(jobId).split(',').map(Number));
      reload();
    },
  });
}

/** 重置整个调度队列，用于任务定义和运行队列不一致时的恢复操作 */
function handleResetQueue() {
  confirmAction({
    content: '确定要重置并刷新调度任务吗?',
    action: () => resetJob(),
    successText: '重置成功',
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () =>
      exportJob({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已完成导出',
    onSuccess: res => saveAs(res.data, `job_${Date.now()}.csv`),
  });
}

function handleView(id: string | number) {
  jobFormModal.value?.openView(id);
}

function handleEdit(id?: string | number) {
  jobFormModal.value?.openEdit(id);
}

function handleFormSuccess() {
  reload();
}

/** 跳转任务日志；0 表示不按任务过滤，查看全部日志 */
function handleViewLog(id: string | number = '0') {
  router.push({
    name: 'JobLog',
    params: { jobId: String(id) },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 单例任务，不支持并发 </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      @change="onTableChange"
      :scroll="tableScroll"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: { columnsStateKey: 'monitor-job', columnsStateType: 'local' },
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
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['monitor:job:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()"
            v-perms:has="['monitor:job:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['monitor:job:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
          <a-button
            type="default"
            @click.prevent="handleViewLog()"
            v-perms:has="['monitor:job:query']"
          >
            <template #icon>
              <ContainerOutlined />
            </template>
            日志
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="handleResetQueue"
            v-perms:has="['monitor:job:remove']"
          >
            <template #icon>
              <SyncOutlined />
            </template>
            重置队列
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'job_group'">
          <DictTag :options="dict.sysJobGroup" :value="record.job_group" />
        </template>
        <template v-if="column.key === 'job_status'">
          <a-switch
            v-if="hasPermissions(['monitor:job:status'])"
            :checked="record.job_status"
            checked-value="1"
            checked-children="正常"
            un-checked-value="0"
            un-checked-children="暂停"
            size="small"
            @change="() => handleStatusChange(record)"
          />
          <DictTag
            v-else
            :options="dict.jobStatus"
            :value="record.job_status"
          />
        </template>
        <template v-if="column.key === 'job_save_log'">
          <DictTag :options="dict.jobSaveLog" :value="record.job_save_log" />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['monitor:job:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleEdit(record.id)"
                v-perms:has="['monitor:job:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['monitor:job:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>执行一次</template>
              <a-button
                type="link"
                @click.prevent="handleRunOnce(record)"
                v-perms:has="['monitor:job:status']"
              >
                <template #icon>
                  <RocketOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>任务日志</template>
              <a-button
                type="link"
                @click.prevent="handleViewLog(record.id)"
                v-perms:has="['monitor:job:log:list']"
              >
                <template #icon>
                  <ContainerOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <JobFormModal ref="jobFormModal" @success="handleFormSuccess" />
  </PageContainer>
</template>
