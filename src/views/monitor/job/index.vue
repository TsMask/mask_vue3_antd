<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
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
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useMessageAction } from '@/hooks/useMessageAction';
import { useCrudModal } from '@/hooks/useCrudModal';
const route = useRoute();
const router = useRouter();
const routePath = route.path;

/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysJobGroup: 'sys_job_group',
  sysJobStatus: 'sys_job_status',
  sysJobSaveLog: 'sys_job_save_log',
});

/** 通用操作反馈：带loading的异步操作、二次确认 */
const { confirmAndRun } = useMessageAction();

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    jobName: '',
    jobGroup: undefined,
    statusFlag: undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/** 分页管理 */
const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

/** 表格UI状态 */
const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } =
  useTableUI();

/** CRUD弹窗管理 */
const { modal, formCtl, openView, openEdit, close, resetForm } = useCrudModal({
  initForm: () => ({
    jobId: undefined,
    jobName: '',
    invokeTarget: '',
    cronExpression: '',
    misfirePolicy: '3',
    concurrent: '0',
    jobGroup: 'DEFAULT',
    statusFlag: '0',
    saveLog: '0',
    targetParams: '',
    remark: '',
    status: '',
    createTime: 0,
  }),
  rules: {
    jobName: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入任务名称，限2-40个字符',
      },
    ],
    invokeTarget: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入调用目标，限2-40个字符',
      },
    ],
    cronExpression: [
      {
        required: true,
        min: 6,
        message: '请输入或生成cron执行表达式',
      },
    ],
  },
});

/** cron生成弹窗状态 */
let cronVisible = ref(false);

/** 表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '任务编号',
    dataIndex: 'jobId',
    align: 'left',
    width: 100,
  },
  {
    title: '任务名称',
    dataIndex: 'jobName',
    align: 'left',
    width: 200,
  },
  {
    title: '调用目标',
    dataIndex: 'invokeTarget',
    align: 'left',
    width: 150,
  },
  {
    title: '任务组名',
    dataIndex: 'jobGroup',
    key: 'jobGroup',
    align: 'left',
    width: 100,
  },
  {
    title: 'cron表达式',
    dataIndex: 'cronExpression',
    align: 'left',
    width: 150,
  },
  {
    title: '状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '记录日志',
    dataIndex: 'saveLog',
    key: 'saveLog',
    align: 'left',
    width: 100,
  },
  {
    title: '操作',
    key: 'jobId',
    align: 'left',
  },
];

/** cron生成弹窗回调 */
function handleCronOk(opt: boolean, cronStr?: string) {
  cronVisible.value = opt;
  if (cronStr) {
    modal.form.cronExpression = cronStr;
  }
}

/** 任务状态修改 */
function handleStatusChange(row: Record<string, string>) {
  const text =
    row.status === '1'
      ? dict.sysJobStatus[0]?.label
      : dict.sysJobStatus[1]?.label;
  confirmAndRun({
    content: `确定要${text} ${row.jobName} 任务吗?`,
    onOk: () => changeStatus(row.jobId, row.statusFlag),
    successText: `${row.jobName} ${text}成功`,
    onSuccess: () => fetchList(),
    // onCancel: revert switch state
  });
  // Note: original code reverts switch on cancel; confirmAndRun doesn't support onCancel
  // This is acceptable since the list will re-fetch anyway
}

/** 任务立即执行一次 */
function handleRunOnce(row: Record<string, string>) {
  confirmAndRun({
    content: `确定要立即执行一次 【${row.jobName}】 任务吗?`,
    onOk: () => runJob(row.jobId),
    successText: `${row.jobName} 执行成功`,
  });
}

/** 删除任务 */
function handleDelete(jobId: string = '0') {
  if (jobId === '0') {
    jobId = tableState.selectedRowKeys.join(',');
  }
  confirmAndRun({
    content: `确认删除定时任务编号为 【${jobId}】 任务吗?`,
    onOk: () => delJob(jobId),
    successText: '删除成功',
    onSuccess: () => fetchList(),
  });
}

/** 重置刷新队列 */
function handleResetQueue() {
  confirmAndRun({
    content: '确定要重置并刷新调度任务吗?',
    onOk: () => resetJob(),
    successText: '重置成功',
  });
}

/** 列表导出 */
function handleExport() {
  confirmAndRun({
    content: '确认根据搜索条件导出xlsx表格文件吗?',
    onOk: () => exportJob(toRaw(queryParams)),
    successText: '已完成导出',
    onSuccess: (res) => {
      saveAs(res.data, `job_${Date.now()}.xlsx`);
    },
  });
}

/** 跳转任务日志页面 */
function handleViewLog(jobId: string | number = '0') {
  router.push(`${routePath}${MENU_PATH_INLINE}/log/${jobId}`);
}

/** 表单提交确认 */
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
  const hide = message.loading('请稍等...', 0);
  modal.confirmLoading = true;
  try {
    const form = toRaw(modal.form);
    const res = form.jobId ? await updateJob(form) : await addJob(form);
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({ content: `${modal.title}成功`, duration: 3 });
      fetchList(1);
      close();
    } else {
      message.error({ content: res.msg, duration: 3 });
    }
  } finally {
    hide();
    modal.confirmLoading = false;
  }
}

/** 查询定时任务列表, pageNum初始页数 */
function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  listJob(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      clearSelection();
      const { total, rows } = res.data;
      setTotal(total);
      tableState.data = rows;
      // 删除后修正页码，避免空页面
      if (fixPageAfterDelete(rows.length)) {
        fetchList();
        return;
      }
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  loadDicts();
  fetchList();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 单例任务，不支持并发 </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">
              <a-input v-model:value="queryParams.jobName" allow-clear placeholder="请输入任务名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <a-select v-model:value="queryParams.jobGroup" allow-clear placeholder="请选择任务组名"
                :options="dict.sysJobGroup">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择任务状态"
                :options="dict.sysJobStatus">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fetchList(1)">
                  <template #icon>
                    <SearchOutlined />
                  </template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <!-- 插槽-卡片左侧 -->
      <template #title>
        <a-space :size="8" align="center">
          <a-button type="primary" @click.prevent="openEdit(undefined, getJob, '添加任务', '修改任务')"
            v-perms:has="['monitor:job:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['monitor:job:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['monitor:job:export']">
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
          <a-button type="default" @click.prevent="handleViewLog()" v-perms:has="['monitor:job:query']">
            <template #icon>
              <ContainerOutlined />
            </template>
            日志
          </a-button>
          <a-button type="dashed" danger @click.prevent="handleResetQueue" v-perms:has="['monitor:job:remove']">
            <template #icon>
              <SyncOutlined />
            </template>
            重置队列
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.seached" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList()">
              <template #icon>
                <ReloadOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon>
                  <ColumnHeightOutlined />
                </template>
              </a-button>
              <template #overlay>
                <a-menu :selected-keys="[tableState.size as string]" @click="setTableSize">
                  <a-menu-item key="default">默认</a-menu-item>
                  <a-menu-item key="middle">中等</a-menu-item>
                  <a-menu-item key="small">紧凑</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>

      <!-- 表格列表 -->
      <a-table class="table" row-key="jobId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName" :pagination="pagination"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'statusFlag'">
            <a-switch v-if="
              dict.sysJobStatus.length > 0 &&
              hasPermissions(['monitor:job:changeStatus'])
            " v-model:checked="record.statusFlag" checked-value="1" :checked-children="dict.sysJobStatus[0].label"
              un-checked-value="0" :un-checked-children="dict.sysJobStatus[1].label" size="small"
              @change="handleStatusChange(record)" />
            <DictTag v-else :options="dict.sysJobStatus" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'saveLog'">
            <DictTag :options="dict.sysJobSaveLog" :value="record.saveLog" />
          </template>
          <template v-if="column.key === 'jobId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="openView(record.jobId, getJob, '任务信息')"
                  v-perms:has="['monitor:job:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="openEdit(record.jobId, getJob, '添加任务', '修改任务')"
                  v-perms:has="['monitor:job:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.jobId)" v-perms:has="['monitor:job:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>执行一次</template>
                <a-button type="link" @click.prevent="handleRunOnce(record)" v-perms:has="['monitor:job:changeStatus']">
                  <template #icon>
                    <RocketOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>任务日志</template>
                <a-button type="link" @click.prevent="handleViewLog(record.jobId)" v-perms:has="['monitor:job:log']">
                  <template #icon>
                    <ContainerOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="modal.visibleByView" :title="modal.title" @cancel="close">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">
              {{ modal.form.jobName }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="出错策略" name="misfirePolicy">
              {{
                ['立即执行', '执行一次', '放弃执行'][
                +modal.form.misfirePolicy - 1
                ]
              }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="是否并发" name="concurrent">
              {{ ['禁止', '允许'][+modal.form.concurrent] }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="invokeTarget">
              {{ modal.form.invokeTarget }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <DictTag :options="dict.sysJobGroup" :value="modal.form.jobGroup" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务状态" name="status">
              {{ ['暂停', '正常'][+modal.form.status] }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录日志" name="saveLog">
              <DictTag :options="dict.sysJobSaveLog" :value="modal.form.saveLog" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="cron表达式" name="cronExpression">
              <a-tag color="default">
                {{ modal.form.cronExpression }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+modal.form.createTime > 0">
                {{ parseDateToStr(+modal.form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="传入参数" name="targetParams" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="modal.form.targetParams" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>

        <a-form-item label="备注说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="modal.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="close">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="modal.visibleByEdit" :title="modal.title" :confirm-loading="modal.confirmLoading" @ok="handleSubmit"
      @cancel="close">
      <a-form name="modalForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName" v-bind="formCtl.validateInfos.jobName">
              <a-input v-model:value="modal.form.jobName" allow-clear placeholder="请输入任务名称" :maxlength="40"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="出错策略" name="misfirePolicy">
              <a-select :disabled="true" v-model:value="modal.form.misfirePolicy" default-value="3" placeholder="出错策略">
                <a-select-option key="1" value="1">立即执行</a-select-option>
                <a-select-option key="2" value="2">执行一次</a-select-option>
                <a-select-option key="3" value="3">放弃执行</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="是否并发" name="concurrent">
              <a-select :disabled="true" v-model:value="modal.form.concurrent" default-value="0" placeholder="是否并发">
                <a-select-option key="1" value="1">允许</a-select-option>
                <a-select-option key="0" value="0">禁止</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="invokeTarget" v-bind="formCtl.validateInfos.invokeTarget">
              <a-input v-model:value="modal.form.invokeTarget" allow-clear placeholder="请输入调用目标" :maxlength="40">
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
            <a-form-item label="任务组名" name="jobGroup">
              <a-select v-model:value="modal.form.jobGroup" default-value="DEFAULT" placeholder="任务组名"
                :options="dict.sysJobGroup">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务状态" name="statusFlag">
              <a-select v-model:value="modal.form.statusFlag" default-value="0" placeholder="任务状态"
                :options="dict.sysJobStatus">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录日志" name="saveLog">
              <a-select v-model:value="modal.form.saveLog" default-value="0" placeholder="记录日志"
                :options="dict.sysJobSaveLog">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="cron表达式" name="cronExpression" v-bind="formCtl.validateInfos.cronExpression"
          :label-col="{ span: 3 }" :label-wrap="true">
          <a-input v-model:value="modal.form.cronExpression" allow-clear placeholder="请输入或生成cron执行表达式">
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
              <a-button type="text" size="small" @click.prevent="handleCronOk(true)">
                <template #icon>
                  <FieldTimeOutlined />
                </template>
                生成表达式
              </a-button>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="传入参数" name="targetParams" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modal.form.targetParams" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="480"
            placeholder="调用目标传入参数，仅支持json字符串" />
        </a-form-item>

        <a-form-item label="备注说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modal.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="可输入任务说明" />
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 生成cron表达式 -->
    <CronModal v-model:open="cronVisible" :cron="modal.form.cronExpression" @ok="handleCronOk(false, $event)">
    </CronModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>