<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, reactive, toRaw, onMounted } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "ant-design-vue/es/table";
import {
  exportSysLogOperate,
  listSysLogOperate,
  cleanSysLogOperate,
} from "@/api/system/log/operate";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { RESULT_CODE_SUCCESS } from "@/constants/result-constants";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useMessageAction } from "@/hooks/useMessageAction";
import { useDictSetup } from "@/hooks/useDictSetup";

const route = useRoute();

const title = ref<string>(route.meta.title ?? "标题");

const { dict, loadDicts } = useDictSetup({
  sysBusinessType: "sys_opera_type",
  sysCommonStatus: "sys_common_status",
});

const { confirmAndRun } = useMessageAction();

const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

const { queryParams, resetQuery: baseResetQuery } = useQueryParams(
  {
    title: "",
    operaBy: "",
    operaIp: "",
    businessType: undefined as string | undefined,
    statusFlag: undefined as string | undefined,
    beginTime: undefined as number | undefined,
    endTime: undefined as number | undefined,
    pageNum: 1,
    pageSize: 20,
    sortBy: "",
    sortOrder: "",
  },
  () => {
    resetPage();
    fetchList();
  },
);

function resetQuery() {
  queryRangePicker.value = undefined;
  baseResetQuery();
}

const {
  tableState,
  setTableSize,
  rowClassName,
} = useTableUI();

const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

const tableColumns: ColumnsType = [
  { title: "日志编号", dataIndex: "id", align: "left", width: 100 },
  { title: "模块名称", dataIndex: "title", align: "left", width: 200 },
  {
    title: "业务类型",
    dataIndex: "businessType",
    key: "businessType",
    align: "left",
    width: 100,
  },
  {
    title: "操作人员",
    dataIndex: "operaBy",
    align: "left",
    width: 100,
    sorter: true,
  },
  { title: "操作IP", dataIndex: "operaIp", align: "left", width: 120 },
  {
    title: "请求方式",
    dataIndex: "operaUrlMethod",
    align: "left",
    width: 100,
  },
  {
    title: "操作状态",
    dataIndex: "statusFlag",
    key: "statusFlag",
    align: "left",
    width: 100,
  },
  {
    title: "操作日期",
    dataIndex: "operaTime",
    align: "left",
    width: 150,
    sorter: true,
    customRender(opt) {
      if (+opt.value <= 0) return "";
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: "消耗时间",
    dataIndex: "costTime",
    key: "costTime",
    align: "right",
    width: 100,
    sorter: true,
    customRender(opt) {
      return `${opt.value} ms`;
    },
  },
  { title: "操作", key: "id", align: "left" },
];

const modalState = reactive({
  visibleByView: false,
  title: "操作日志",
  form: {} as Record<string, any>,
});

/** 直接从行数据打开操作日志详情弹窗（无需再次请求接口） */
function handleView(row: Record<string, string>) {
  Object.assign(modalState.form, row);
  modalState.title = "操作日志信息";
  modalState.visibleByView = true;
}

/** 关闭操作日志详情弹窗 */
function handleCancel() {
  modalState.visibleByView = false;
}

/** 表格排序变化回调，同步排序参数并重新查询 */
function handleTableChange(_pagination: any, _filters: any, sorter: any) {
  queryParams.sortBy = sorter.order ? sorter.field : undefined;
  queryParams.sortOrder = sorter.order;
  fetchList();
}

/** 清空所有操作日志，操作前需二次确认 */
function handleCleanList() {
  confirmAndRun({
    content: "确认清空所有操作日志数据项?",
    onOk: () => cleanSysLogOperate(),
    successText: "清空成功",
    onSuccess: () => fetchList(),
  });
}

/** 根据当前搜索条件导出操作日志列表 xlsx 文件 */
function handleExport() {
  confirmAndRun({
    content: "确认根据搜索条件导出xlsx表格文件吗",
    onOk: () => exportSysLogOperate(toRaw(queryParams)),
    successText: "已导出完成",
    onSuccess: (res) => {
      saveAs(res.data, `sys_log_operate_${Date.now()}.xlsx`);
    },
  });
}

/** 查询操作日志列表，支持指定页码；处理日期范围筛选及删除后空页修正 */
async function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }

  if (
    Array.isArray(queryRangePicker.value) &&
    queryRangePicker.value.length > 0
  ) {
    queryParams.beginTime = queryRangePicker.value[0].startOf("day").valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf("day").valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }

  try {
    const res = await listSysLogOperate(toRaw(queryParams));
    if (res.code === RESULT_CODE_SUCCESS) {
      setTotal(res.data.total);
      tableState.data = res.data.rows;
      if (fixPageAfterDelete(res.data.rows.length)) {
        queryParams.pageNum = pagination.current;
        const res2 = await listSysLogOperate(toRaw(queryParams));
        if (res2.code === RESULT_CODE_SUCCESS) {
          setTotal(res2.data.total);
          tableState.data = res2.data.rows;
        }
      }
    }
  } finally {
    tableState.loading = false;
  }
}

onMounted(() => {
  loadDicts();
  fetchList();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        对接口请求进行日志收集，统计高频接口分析优化等操作。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="模块名称" name="title">
              <a-input v-model:value="queryParams.title" allow-clear placeholder="请输入模块名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作人员" name="operaBy">
              <a-input v-model:value="queryParams.operaBy" allow-clear placeholder="请输入操作人员"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作IP" name="operaIp">
              <a-input v-model:value="queryParams.operaIp" allow-clear placeholder="请输入操作IP"
                @keyup.enter.native="fetchList()"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="业务类型" name="businessType">
              <a-select v-model:value="queryParams.businessType" allow-clear placeholder="请选择业务类型"
                :options="dict.sysBusinessType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择操作状态"
                :options="dict.sysCommonStatus">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作时间" name="queryRangePicker">
              <a-range-picker v-model:value="queryRangePicker" :bordered="true" :allow-clear="true"
                style="width: 100%"></a-range-picker>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fetchList(1)">
                  <template #icon><SearchOutlined /></template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon><ClearOutlined /></template>
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
          <a-button type="dashed" danger @click.prevent="handleCleanList()" v-perms:has="['system:log:operate:remove']">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:log:operate:export']">
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
        </a-space>
      </template>

      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.seached" checked-children="是" un-checked-children="否" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList()">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon><ColumnHeightOutlined /></template>
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

      <a-table class="table" row-key="id" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'businessType'">
            <DictTag :options="dict.sysBusinessType" :value="record.businessType" />
          </template>
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysCommonStatus" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record)" v-perms:has="['system:log:operate:query']">
                  <template #icon><ProfileOutlined /></template>
                  详情
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="modalState.visibleByView" :title="modalState.title"
      @cancel="handleCancel">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="日志编号" name="id">
              {{ modalState.form.id }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="statusFlag">
              <a-tag :color="+modalState.form.statusFlag ? 'success' : 'error'">
                {{ ['失败', '正常'][+modalState.form.statusFlag] }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="业务类型" name="businessType">
              {{ modalState.form.title }} /
              <DictTag :options="dict.sysBusinessType" :value="modalState.form.businessType" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作人员" name="operaBy">
              {{ modalState.form.operaBy }} / {{ modalState.form.operaIp }} /
              {{ modalState.form.operaLocation }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求地址" name="operaUrl">
              {{ modalState.form.operaUrlMethod }}
              {{ modalState.form.operaUrl }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作时间" name="operaTime">
              <span v-if="+modalState.form.operaTime > 0">
                {{ parseDateToStr(+modalState.form.operaTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求耗时" name="costTime">
              {{ modalState.form.costTime }} ms
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作方法" name="operaMethod">
              {{ modalState.form.operaMethod }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="请求参数" name="operaParam" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.operaParam" :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="请求参数" :disabled="true" />
        </a-form-item>
        <a-form-item label="操作信息" name="operaMsg" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.operaMsg" :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="操作信息" :disabled="true" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCancel">关闭</a-button>
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


