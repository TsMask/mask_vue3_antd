<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, watch } from "vue";
import { PageContainer } from "antdv-pro-layout";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "ant-design-vue/es/table";
import { exportSysLogLogin, listSysLogLogin, cleanSysLogLogin } from "@/api/system/log/login";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useListQuery } from "@/hooks/useListQuery";
import { confirmAction } from "@/hooks/useAction";

const route = useRoute();
const title = ref<string>(route.meta.title ?? "标题");

const { dict } = useDictSetup({ keyMap: { sysCommonStatus: "sys_common_status" } });

const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

function syncDateRange() {
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.begin_time = queryRangePicker.value[0].startOf("day").valueOf();
    queryParams.end_time = queryRangePicker.value[1].endOf("day").valueOf();
  } else {
    queryParams.begin_time = undefined;
    queryParams.end_time = undefined;
  }
}

const { queryParams, handleQuery, resetQuery: baseResetQuery } = useQueryParams(
  {
    login_ip: "", login_user_name: "",
    login_status: undefined as string | undefined,
    begin_time: undefined as number | undefined,
    end_time: undefined as number | undefined,
    page_num: 1, page_size: 20,
    sort: ""
  },
  () => { resetPage(); fetchList(); },
);

function resetQuery() { queryRangePicker.value = undefined; baseResetQuery(); }

const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, page_size) => { queryParams.page_num = page; queryParams.page_size = page_size; fetchList() },
});

const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => listSysLogLogin(toRaw(queryParams)),
});

const { tableState, setTableSize, rowClassName } = useTableUI();

const tableColumns: ColumnsType = [
  { title: "日志编号", dataIndex: "id", align: "left", width: 100 },
  { title: "登录账号", dataIndex: "login_user_name", align: "left", width: 150, sorter: true },
  { title: "登录IP", dataIndex: "login_ip", align: "left", width: 150 },
  { title: "登录地点", dataIndex: "login_location", align: "left", width: 150 },
  { title: "操作系统", dataIndex: "login_os", align: "left", width: 150 },
  { title: "浏览器", dataIndex: "login_browser", align: "left", width: 200 },
  { title: "登录状态", dataIndex: "login_status", key: "login_status", align: "left", width: 100 },
  {
    title: "登录时间", dataIndex: "create_time", align: "left", width: 150, sorter: true,
    customRender(opt) {
      if (+opt.value <= 0) return "";
      return parseDateToStr(+opt.value);
    }
  },
  { title: "登录信息", dataIndex: "login_msg", align: "left", ellipsis: true },
];

function handleTableChange(_pagination: any, _filters: any, sorter: any) {
  const sorters = Array.isArray(sorter) ? sorter : sorter.order ? [sorter] : [];
  queryParams.sort = sorters
    .filter(s => s.order)
    .map(s => s.field + ":" + (s.order === "ascend" ? "asc" : "desc"))
    .join(",");
  fetchList();
}

function handleCleanList() {
  confirmAction({
    content: "确认清空所有登录日志数据项?",
    action: () => cleanSysLogLogin(), variables: undefined as any, successText: "清空成功",
  });
}

function handleExport() {
  confirmAction({
    content: "确认根据搜索条件导出数据文件吗",
    action: () => exportSysLogLogin(toRaw(queryParams)), variables: undefined as any, successText: "已导出完成",
    onSuccess: (res) => { saveAs(res.data, `sys_log_login_${Date.now()}.csv`); },
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

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="login_user_name">
              <a-input v-model:value="queryParams.login_user_name" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录IP" name="login_ip">
              <a-input v-model:value="queryParams.login_ip" allow-clear :maxlength="128" placeholder="请输入登录IP"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录状态" name="login_status">
              <a-select v-model:value="queryParams.login_status" allow-clear placeholder="请选择登录状态"
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
          <a-button type="dashed" danger @click.prevent="handleCleanList()" v-perms:has="['system:log:login:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:log:login:export']">
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
            <a-switch v-model:checked="tableState.searched" checked-children="是" un-checked-children="否" size="small" />
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
          x: tableColumns.length * 160,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'login_status'">
            <DictTag :options="dict.sysCommonStatus" :value="record.login_status" />
          </template>
        </template>
      </a-table>
    </a-card>
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
