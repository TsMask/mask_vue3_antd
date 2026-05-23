<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
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
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useMessageAction } from '@/hooks/useMessageAction';
const tabsStore = useTabsStore();
const route = useRoute();
const router = useRouter();

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysJobGroup: 'sys_job_group',
  sysCommonStatus: 'sys_common_status',
});

/** 通用操作反馈：带loading的异步操作、二次确认 */
const { confirmAndRun } = useMessageAction();

/** 开始结束时间范围 */
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    jobId: '',
    statusFlag: undefined,
    beginTime: undefined as undefined | number,
    endTime: undefined as undefined | number,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    queryRangePicker.value = undefined;
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

/** 表格搜索栏默认展开 */
tableState.seached = true;

/** 表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '日志编号',
    dataIndex: 'logId',
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
    title: '执行状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '记录时间',
    dataIndex: 'createTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '消耗时间',
    dataIndex: 'costTime',
    key: 'costTime',
    align: 'right',
    width: 100,
    customRender(opt) {
      return `${opt.value} ms`;
    },
  },
  {
    title: '操作',
    key: 'logId',
    align: 'left',
  },
];

/** 详情弹窗状态 */
let detailVisible = ref(false);
let detailTitle = '任务日志';
let detailForm = reactive({
  logId: undefined as string | number | undefined,
  jobName: '',
  jobGroup: 'DEFAULT',
  invokeTarget: '',
  targetParams: '',
  statusFlag: '0',
  jobMsg: '',
  createTime: 0,
});

/** 打开详情弹窗 */
function handleViewDetail(row: Record<string, string>) {
  Object.assign(detailForm, row);
  detailTitle = '调度日志信息';
  detailVisible.value = true;
}

/** 关闭详情弹窗 */
function handleCloseDetail() {
  detailVisible.value = false;
}

/** 删除选中的调度日志 */
function handleDeleteSelected() {
  const ids = tableState.selectedRowKeys.join(',');
  confirmAndRun({
    content: `确认删除调度日志编号为 【${ids}】 的数据项吗?`,
    onOk: () => delJobLog(ids),
    successText: '删除成功',
    onSuccess: () => fetchList(),
  });
}

/** 清空所有调度日志 */
function handleCleanAll() {
  confirmAndRun({
    content: '确认清空所有调度日志数据项吗?',
    onOk: () => cleanJobLog(),
    successText: '清空成功',
    onSuccess: () => fetchList(),
  });
}

/** 列表导出 */
function handleExport() {
  confirmAndRun({
    content: '确认根据搜索条件导出xlsx表格文件吗?',
    onOk: () => exportJobLog(toRaw(queryParams)),
    successText: '已完成导出',
    onSuccess: (res) => {
      saveAs(res.data, `job_log_${Date.now()}.xlsx`);
    },
  });
}

/** 关闭页面并跳转 */
function handleClose() {
  const to = tabsStore.tabClose(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}

/** 解析时间范围并同步到查询参数 */
function syncTimeRange() {
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.beginTime = queryRangePicker.value[0].startOf('day').valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf('day').valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
}

/** 查询调度日志列表, pageNum初始页数 */
function fetchList(pageNum?: number) {
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  syncTimeRange();
  listJobLog(toRaw(queryParams)).then(res => {
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
  // 获取地址栏参数 指定任务id数据列表
  const jobId = route.params && (route.params.jobId as string);
  if (jobId) {
    queryParams.jobId = jobId;
  }
  fetchList();
});
</script>

<template>
  <PageContainer>
    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="执行状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择执行状态"
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
      <a-table class="table" row-key="logId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName" :scroll="{
          x: tableColumns.length * 140,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'statusFlag'">
            <a-tag v-if="dict.sysCommonStatus.length > 0" :color="+record.statusFlag ? 'success' : 'error'">
              {{
                +detailForm.statusFlag
                  ? dict.sysCommonStatus[0].label
                  : dict.sysCommonStatus[1].label
              }}
            </a-tag>
          </template>
          <template v-if="column.key === 'logId'">
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
            <a-form-item label="日志编号" name="logId">
              {{ detailForm.logId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="statusFlag">
              <a-tag v-if="dict.sysCommonStatus.length > 0" :color="+detailForm.statusFlag ? 'success' : 'error'">
                {{
                  +detailForm.statusFlag
                    ? dict.sysCommonStatus[0].label
                    : dict.sysCommonStatus[1].label
                }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">
              {{ detailForm.jobName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <DictTag :options="dict.sysJobGroup" :value="detailForm.jobGroup" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="invokeTarget">
              {{ detailForm.invokeTarget }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录时间" name="createTime">
              <span v-if="+detailForm.createTime > 0">
                {{ parseDateToStr(+detailForm.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="传入参数" name="targetParams" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="detailForm.targetParams" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
        <a-form-item label="日志信息" name="jobMsg" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="detailForm.jobMsg" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
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
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>