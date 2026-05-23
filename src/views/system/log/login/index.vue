<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, onMounted } from "vue";
import { PageContainer } from "antdv-pro-layout";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "ant-design-vue/es/table";
import {
  exportSysLogLogin,
  listSysLogLogin,
  cleanSysLogLogin,
} from "@/api/system/log/login";
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
  sysCommonStatus: "sys_common_status",
});

const { confirmAndRun } = useMessageAction();

const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

const { queryParams, resetQuery: baseResetQuery } = useQueryParams(
  {
    loginIp: "",
    userName: "",
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

/** 重置查询条件，清空日期选择器后恢复默认参数并重新查询 */
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
  {
    title: "登录账号",
    dataIndex: "userName",
    align: "left",
    width: 150,
    sorter: true,
  },
  { title: "登录IP", dataIndex: "loginIp", align: "left", width: 150 },
  {
    title: "登录地点",
    dataIndex: "loginLocation",
    align: "left",
    width: 150,
  },
  { title: "操作系统", dataIndex: "os", align: "left", width: 150 },
  { title: "浏览器", dataIndex: "browser", align: "left", width: 200 },
  {
    title: "登录状态",
    dataIndex: "statusFlag",
    key: "statusFlag",
    align: "left",
    width: 100,
  },
  {
    title: "登录时间",
    dataIndex: "loginTime",
    align: "left",
    width: 150,
    sorter: true,
    customRender(opt) {
      if (+opt.value <= 0) return "";
      return parseDateToStr(+opt.value);
    },
  },
  { title: "登录信息", dataIndex: "msg", align: "left", ellipsis: true },
];

/** 表格排序变化回调，同步排序参数并重新查询 */
function handleTableChange(_pagination: any, _filters: any, sorter: any) {
  queryParams.sortBy = sorter.order ? sorter.field : undefined;
  queryParams.sortOrder = sorter.order;
  fetchList();
}

/** 清空所有登录日志，操作前需二次确认 */
function handleCleanList() {
  confirmAndRun({
    content: "确认清空所有登录日志数据项?",
    onOk: () => cleanSysLogLogin(),
    successText: "清空成功",
    onSuccess: () => fetchList(),
  });
}

/** 根据当前搜索条件导出登录日志列表 xlsx 文件 */
function handleExport() {
  confirmAndRun({
    content: "确认根据搜索条件导出xlsx表格文件吗",
    onOk: () => exportSysLogLogin(toRaw(queryParams)),
    successText: "已导出完成",
    onSuccess: (res) => {
      saveAs(res.data, `sys_log_login_${Date.now()}.xlsx`);
    },
  });
}

/** 查询登录日志列表，支持指定页码；处理日期范围筛选及删除后空页修正 */
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
    const res = await listSysLogLogin(toRaw(queryParams));
    if (res.code === RESULT_CODE_SUCCESS) {
      setTotal(res.data.total);
      tableState.data = res.data.rows;
      if (fixPageAfterDelete(res.data.rows.length)) {
        queryParams.pageNum = pagination.current;
        const res2 = await listSysLogLogin(toRaw(queryParams));
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
        对登录进行日志收集，登录锁定的信息存入
        <a-typography-text code>Redis</a-typography-text>
        可对登录账号进行解锁。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input v-model:value="queryParams.userName" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录IP" name="loginIp">
              <a-input v-model:value="queryParams.loginIp" allow-clear :maxlength="128" placeholder="请输入登录IP"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择登录状态"
                :options="dict.sysCommonStatus">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录时间" name="queryRangePicker">
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
          <a-button type="dashed" danger @click.prevent="handleCleanList()" v-perms:has="['system:log:login:remove']">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:log:login:export']">
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
          x: tableColumns.length * 160,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysCommonStatus" :value="record.statusFlag" />
          </template>
        </template>
      </a-table>
    </a-card>
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


