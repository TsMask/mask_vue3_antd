<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, reactive, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportJobLog,
  listJobLog,
  delJobLog,
  cleanJobLog,
} from '@/api/monitor/jobLog';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useTabsStore from '@/store/modules/tabs';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { confirmAction } from '@/hooks/useAction';

const tabsStore = useTabsStore();
const route = useRoute();
const router = useRouter();
/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: {
    sysJobGroup: 'sys_job_group',
    sysCommonStatus: 'sys_common_status',
  }
});

/** 开始结束时间范围 */
const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/** 查询参数 */
const { queryParams, handleQuery, resetQuery: baseResetQuery } = useQueryParams(
  {
    id: (route.params.jobId as string) || '',
    logStatus: undefined as string | undefined,
    beginTime: undefined as number | undefined,
    endTime: undefined as number | undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => { resetPage(); fetchList(); },
);

/** 重置查询条件，清空日期选择器后恢复默认参数 */
function resetQuery() {
  queryRangePicker.value = undefined;
  baseResetQuery();
}

/** 同步日期范围到查询参数 */
function syncDateRange() {
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.beginTime = queryRangePicker.value[0].startOf('day').valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf('day').valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
}

const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList()
  },
});

/** 列表数据查询 */
const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => { syncDateRange(); return listJobLog(toRaw(queryParams)); },
});

const { tableState, setTableSize, rowClassName, setSelectedRowKeys } = useTableUI();

tableState.searched = true;

const tableColumns: ColumnsType = [
  { title: '日志编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '任务名称', dataIndex: 'jobName', align: 'left', width: 200 },
  { title: '调用目标', dataIndex: 'jobInvokeTarget', align: 'left', width: 150 },
  { title: '任务组名', dataIndex: 'jobGroup', key: 'jobGroup', align: 'left', width: 100 },
  { title: '执行状态', dataIndex: 'logStatus', key: 'logStatus', align: 'left', width: 100 },
  {
    title: '记录时间', dataIndex: 'createTime', align: 'left', width: 150,
    customRender(opt) { if (+opt.value <= 0) return ''; return parseDateToStr(+opt.value); },
  },
  {
    title: '消耗时间', dataIndex: 'logCostTime', key: 'logCostTime', align: 'right', width: 100,
    customRender(opt) { return `${opt.value} ms`; },
  },
  { title: '操作', key: 'id', align: 'left' },
];

/** 详情弹窗状态 */
const detailVisible = ref(false);
const detailTitle = ref('任务日志');
const detailForm = reactive({
  id: undefined as string | number | undefined,
  jobName: '',
  jobGroup: 'DEFAULT',
  jobInvokeTarget: '',
  jobTargetParams: '',
  logStatus: '0',
  logMsg: '',
  createTime: 0,
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
  const ids = tableState.selectedRowKeys.join(',');
  confirmAction({
    content: `确认删除调度日志编号为 【${ids}】 的数据项吗?`,
    action: () => delJobLog(ids),
    variables: undefined,
    successText: '删除成功',
    onSuccess() {
      const deletedCount = String(ids).split(",").length;
      if (!clampPage(deletedCount)) fetchList();
    },
  });
}

function handleCleanAll() {
  confirmAction({
    content: '确认清空所有调度日志数据项吗?',
    action: () => cleanJobLog(),
    variables: undefined,
    successText: '清空成功',
  });
}

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () => exportJobLog(toRaw(queryParams)),
    variables: undefined,
    successText: '已完成导出',
    onSuccess: (res) => saveAs(res.data, `job_log_${Date.now()}.csv`),
  });
}

function handleClose() {
  const to = tabsStore.tabClose(route.path);
  if (to) { router.push(to); } else { router.back(); }
}
</script>

<template>
  <PageContainer>
    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="执行状态" name="logStatus">
              <a-select v-model:value="queryParams.logStatus" allow-clear placeholder="请选择执行状态"
                :options="dict.sysCommonStatus">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="8" :md="12" :xs="24">
            <a-form-item label="记录时间" name="queryRangePicker">
              <a-range-picker v-model:value="queryRangePicker" :bordered="true" :allow-clear="true"
                style="width: 100%"></a-range-picker>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="handleQuery">
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
      <template #title>
        <a-space :size="8" align="center">
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon>
              <CloseOutlined />
            </template>
            关闭
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDeleteSelected()" v-perms:has="['monitor:job:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button type="dashed" danger @click.prevent="handleCleanAll()" v-perms:has="['monitor:job:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['monitor:job:export']">
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>

      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.searched" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList">
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

      <a-table class="antdv-table" row-key="id" :columns="tableColumns" :loading="loading" :data-source="listData"
        :size="tableState.size" :row-class-name="rowClassName" :scroll="{
          x: tableColumns.length * 140, scrollToFirstRowOnChange: true,
        }" :pagination="{ ...pagination }" :row-selection="{
          type: 'checkbox', selectedRowKeys: tableState.selectedRowKeys, onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'logStatus'">
            <a-tag v-if="dict.sysCommonStatus.length > 0" :color="+record.logStatus ? 'success' : 'error'">
              {{ +record.logStatus ? dict.sysCommonStatus[0].label : dict.sysCommonStatus[1].label }}
            </a-tag>
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleViewDetail(record)" v-perms:has="['monitor:job:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                  详情
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="detailVisible" :title="detailTitle" @cancel="handleCloseDetail">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="日志编号" name="id">{{ detailForm.id }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="logStatus">
              <a-tag v-if="dict.sysCommonStatus.length > 0" :color="+detailForm.logStatus ? 'success' : 'error'">
                {{ +detailForm.logStatus ? dict.sysCommonStatus[0].label : dict.sysCommonStatus[1].label }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">{{ detailForm.jobName }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <DictTag :options="dict.sysJobGroup" :value="detailForm.jobGroup" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="jobInvokeTarget">{{ detailForm.jobInvokeTarget }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录时间" name="createTime">
              <span v-if="+detailForm.createTime > 0">{{ parseDateToStr(+detailForm.createTime) }}</span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="传入参数" name="jobTargetParams" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="detailForm.jobTargetParams" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
        <a-form-item label="日志信息" name="logMsg" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="detailForm.logMsg" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCloseDetail">关闭</a-button>
      </template>
    </ProModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.antdv-table :deep(.antdv-striped) td {
  background-color: #fafafa;
}

.antdv-table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>