<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import {
  exportJob,
  listJob,
  getJob,
  delJob,
  addJob,
  updateJob,
  runJob,
  changeStatus,
  resetJob,
} from '@/api/monitor/job';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import { hasPermissions } from '@/plugins/auth-user';
import { MENU_PATH_INLINE } from '@/constants/menu-constants';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useCrudModal } from '@/hooks/useCrudModal';
import { useAction, confirmAction } from '@/hooks/useAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const router = useRouter();
const routePath = route.path;

const title = ref<string>(route.meta.title ?? '标题');

const { dict } = useDictSetup({
  keyMap: {
    sysJobGroup: 'sys_job_group',
    sysJobStatus: 'sys_job_status',
    sysJobSaveLog: 'sys_job_save_log',
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

const {
  modal,
  formCtl,
  isView,
  openView,
  openEdit,
  close: handleCancel,
} = useCrudModal({
  initForm: () => ({
    id: undefined as string | number | undefined,
    job_name: '',
    job_invoke_target: '',
    job_cron: '',
    job_misfire_policy: '3',
    job_concurrent: '0',
    job_group: 'DEFAULT',
    job_status: '0',
    job_save_log: '0',
    job_target_params: '',
    remark: '',
    status: '',
    create_time: 0,
  }),
  rules: {
    job_name: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入任务名称，限2-40个字符',
      },
    ],
    job_invoke_target: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入调用目标，限2-40个字符',
      },
    ],
    job_cron: [
      { required: true, min: 6, message: '请输入或生成cron执行表达式' },
    ],
  },
});

/** 新增/编辑 mutation */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form: Record<string, any>) =>
    form.id ? updateJob(form) : addJob(form),
  successText: '操作成功',
  onSuccess() {
    handleCancel();
    reload();
  },
});

const cronVisible = ref(false);

const tableColumns = computed<ProColumns[]>(() => [
  { title: '任务编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '任务名称', dataIndex: 'job_name', align: 'left', width: 200 },
  {
    title: '调用目标',
    dataIndex: 'job_invoke_target',
    align: 'left',
    width: 150,
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
  { title: 'cron表达式', dataIndex: 'job_cron', align: 'left', width: 150 },
  {
    title: '状态',
    dataIndex: 'job_status',
    key: 'job_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysJobStatus),
  },
  {
    title: '记录日志',
    dataIndex: 'job_save_log',
    key: 'job_save_log',
    align: 'left',
    width: 100,
  },
  { title: '操作', key: 'operation', align: 'left', width: 210 },
]);

const tableScroll = useProTableScroll(tableColumns);

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
    valueEnum: toProValueEnum(dict.sysJobStatus),
  },
]);

function handleCronOk(opt: boolean, cronStr?: string) {
  cronVisible.value = opt;
  if (cronStr) modal.form.job_cron = cronStr;
}

function handleStatusChange(row: Record<string, string>) {
  const text =
    row.job_status === '1'
      ? dict.sysJobStatus[0]?.label
      : dict.sysJobStatus[1]?.label;
  confirmAction({
    content: `确定要${text} ${row.job_name} 任务吗?`,
    action: () => changeStatus(row.id, row.job_status),
    variables: undefined,
    successText: `${row.job_name} ${text}成功`,
  });
}

function handleRunOnce(row: Record<string, string>) {
  confirmAction({
    content: `确定要立即执行一次 【${row.job_name}】 任务吗?`,
    action: () => runJob(row.id),
    variables: undefined,
    successText: `${row.job_name} 执行成功`,
  });
}

function handleDelete(id: string = '0') {
  if (id === '0') id = selectedRowKeys.value.join(',');
  confirmAction({
    content: `确认删除定时任务编号为 【${id}】 任务吗?`,
    action: () => delJob(id),
    variables: undefined,
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

function handleResetQueue() {
  confirmAction({
    content: '确定要重置并刷新调度任务吗?',
    action: () => resetJob(),
    variables: undefined,
    successText: '重置成功',
  });
}

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () =>
      exportJob({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    variables: undefined,
    successText: '已完成导出',
    onSuccess: res => saveAs(res.data, `job_${Date.now()}.csv`),
  });
}

function handleViewLog(id: string | number = '0') {
  router.push(`${routePath}${MENU_PATH_INLINE}/log/${id}`);
}

async function handleSubmit() {
  try {
    await formCtl.validate();
  } catch (e: any) {
    message.error({
      content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }
  await submitExecute(toRaw(modal.form));
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
            @click.prevent="openEdit(undefined, getJob, '添加任务', '修改任务')"
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
            v-if="
              dict.sysJobStatus.length > 0 &&
              hasPermissions(['monitor:job:changeStatus'])
            "
            v-model:checked="record.job_status"
            checked-value="1"
            :checked-children="dict.sysJobStatus[0].label"
            un-checked-value="0"
            :un-checked-children="dict.sysJobStatus[1].label"
            size="small"
            @change="handleStatusChange(record)"
          />
          <DictTag
            v-else
            :options="dict.sysJobStatus"
            :value="record.job_status"
          />
        </template>
        <template v-if="column.key === 'job_save_log'">
          <DictTag :options="dict.sysJobSaveLog" :value="record.job_save_log" />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="openView(record.id, getJob, '任务信息')"
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
                @click.prevent="
                  openEdit(record.id, getJob, '添加任务', '修改任务')
                "
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
                v-perms:has="['monitor:job:changeStatus']"
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
                v-perms:has="['monitor:job:log']"
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

    <!-- 详情框或新增修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="!isView"
      :mask-closable="isView"
      :open="modal.visible"
      :title="modal.title"
      :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        name="modalForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
        :disabled="isView"
      >
        <a-row v-if="isView">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="create_time">
              <span v-if="+modal.form.create_time > 0">{{
                parseDateToStr(+modal.form.create_time)
              }}</span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="任务名称"
              name="job_name"
              v-bind="formCtl.validateInfos.job_name"
            >
              <a-input
                v-model:value="modal.form.job_name"
                allow-clear
                placeholder="请输入任务名称"
                :maxlength="40"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="出错策略" name="job_misfire_policy">
              <a-select
                :disabled="true"
                v-model:value="modal.form.job_misfire_policy"
                default-value="3"
                placeholder="出错策略"
              >
                <a-select-option key="1" value="1">立即执行</a-select-option>
                <a-select-option key="2" value="2">执行一次</a-select-option>
                <a-select-option key="3" value="3">放弃执行</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="是否并发" name="job_concurrent">
              <a-select
                :disabled="true"
                v-model:value="modal.form.job_concurrent"
                default-value="0"
                placeholder="是否并发"
              >
                <a-select-option key="1" value="1">允许</a-select-option>
                <a-select-option key="0" value="0">禁止</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="调用目标"
              name="job_invoke_target"
              v-bind="formCtl.validateInfos.job_invoke_target"
            >
              <a-input
                v-model:value="modal.form.job_invoke_target"
                allow-clear
                placeholder="请输入调用目标"
                :maxlength="40"
              >
                <template #prefix>
                  <a-tooltip placement="topLeft">
                    <template #title>
                      <div>
                        Processor调用示例：simple <br />
                        定义任务处理器示例：src\modules\monitor\processor <br />
                        参数说明：支持预设传入参数，在处理器中进行序列化处理参数
                      </div>
                    </template>
                    <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="job_group">
              <a-select
                v-model:value="modal.form.job_group"
                default-value="DEFAULT"
                placeholder="任务组名"
                :options="dict.sysJobGroup"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务状态" name="job_status">
              <a-select
                v-model:value="modal.form.job_status"
                default-value="0"
                placeholder="任务状态"
                :options="dict.sysJobStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录日志" name="job_save_log">
              <a-select
                v-model:value="modal.form.job_save_log"
                default-value="0"
                placeholder="记录日志"
                :options="dict.sysJobSaveLog"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="cron表达式"
          name="job_cron"
          v-bind="formCtl.validateInfos.job_cron"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-input
            v-model:value="modal.form.job_cron"
            allow-clear
            placeholder="请输入或生成cron执行表达式"
          >
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    表达式示例：0/20 * * * * ? <br />
                    示例说明：每20秒执行任务
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
            <template #addonAfter>
              <a-button
                type="text"
                size="small"
                @click.prevent="handleCronOk(true)"
              >
                <template #icon>
                  <FieldTimeOutlined />
                </template>
                生成表达式
              </a-button>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="传入参数"
          name="job_target_params"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modal.form.job_target_params"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="480"
            placeholder="调用目标传入参数，仅支持json字符串"
          />
        </a-form-item>
        <a-form-item
          label="备注说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modal.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="200"
            :show-count="!isView"
            placeholder="可输入任务说明"
          />
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 生成cron表达式 -->
    <CronModal
      v-model:open="cronVisible"
      :cron="modal.form.job_cron"
      @ok="handleCronOk(false, $event)"
    >
    </CronModal>
  </PageContainer>
</template>

<style scoped></style>
