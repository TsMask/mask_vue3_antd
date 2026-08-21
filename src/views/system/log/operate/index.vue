<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "ant-design-vue/es/table";
import { exportSysLogOperate, listSysLogOperate, cleanSysLogOperate } from "@/api/system/log/operate";
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

const { dict } = useDictSetup({ keyMap: { sysBusinessType: "sys_opera_type", sysCommonStatus: "sys_common_status" } });

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
    create_by: "", operate_ip: "", title: "",
    operate_type: undefined as string | undefined,
    operate_status: undefined as string | undefined,
    begin_time: undefined as number | undefined,
    end_time: undefined as number | undefined,
    page_num: 1, page_size: 20,
    sort: ""
  },
  () => { resetPage(); fetchList(); },
);

function resetQuery() { queryRangePicker.value = undefined; baseResetQuery(); }

const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, page_size) => { queryParams.page_num = page; queryParams.page_size = page_size; fetchList(); },
});

const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => listSysLogOperate(toRaw(queryParams)),
});

const { tableState, setTableSize, rowClassName, setSelectedRowKeys } = useTableUI();

const tableColumns: ColumnsType = [
  { title: "日志编号", dataIndex: "id", align: "left", width: 100 },
  { title: "系统模块", dataIndex: "title", align: "left", width: 150 },
  { title: "操作类型", dataIndex: "operate_type", key: "operate_type", align: "left", width: 100 },
  { title: "操作人员", dataIndex: "create_by", align: "left", width: 100 },
  { title: "操作地址", dataIndex: "operate_ip", align: "left", width: 150 },
  { title: "操作状态", dataIndex: "operate_status", key: "operate_status", align: "left", width: 100 },
  { title: "操作时间", dataIndex: "create_time", align: "left", width: 150, sorter: true, customRender(opt) { if (+opt.value <= 0) return ""; return parseDateToStr(+opt.value); } },
  { title: "操作", key: "id", align: "left" },
];

/** 详情弹窗状态 */
const visibleByView = ref(false);
const detailForm = ref<Record<string, any>>({});

/** 打开详情弹窗 */
function handleView(row: Record<string, any>) {
  if (row.operate_param) {
    try {
      row.operate_param = JSON.stringify(JSON.parse(row.operate_param), null, 2);
    } catch {
      // 非 JSON 格式保持原样
    }
  }
  if (row.operate_msg) {
    try {
      row.operate_msg = JSON.stringify(JSON.parse(row.operate_msg), null, 2);
    } catch {
      // 非 JSON 格式保持原样
    }
  }
  detailForm.value = row;
  visibleByView.value = true;
}

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
    content: "确认清空所有操作日志数据项?",
    action: () => cleanSysLogOperate(), variables: undefined as any, successText: "清空成功",
  });
}

function handleExport() {
  confirmAction({
    content: "确认根据搜索条件导出数据文件吗",
    action: () => exportSysLogOperate(toRaw(queryParams)), variables: undefined as any, successText: "已导出完成",
    onSuccess: (res) => { saveAs(res.data, `sys_log_operate_${Date.now()}.csv`); },
  });
}
</script>
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        对接口请求进行日志收集，统计高频接口分析优化等操作。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="模块名称" name="title">
              <a-input v-model:value="queryParams.title" allow-clear placeholder="请输入模块名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作人员" name="create_by">
              <a-input v-model:value="queryParams.create_by" allow-clear placeholder="请输入操作人员"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作IP" name="operate_ip">
              <a-input v-model:value="queryParams.operate_ip" allow-clear placeholder="请输入操作IP"
                @keyup.enter="fetchList"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="业务类型" name="operate_type">
              <a-select v-model:value="queryParams.operate_type" allow-clear placeholder="请选择业务类型"
                :options="dict.sysBusinessType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作状态" name="operate_status">
              <a-select v-model:value="queryParams.operate_status" allow-clear placeholder="请选择操作状态"
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
          <a-button type="dashed" danger @click.prevent="handleCleanList()" v-perms:has="['system:log:operate:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:log:operate:export']">
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
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operate_type'">
            <DictTag :options="dict.sysBusinessType" :value="record.operate_type" />
          </template>
          <template v-if="column.key === 'operate_status'">
            <DictTag :options="dict.sysCommonStatus" :value="record.operate_status" />
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record)" v-perms:has="['system:log:operate:query']">
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
    <ProModal :drag="true" :width="800" :open="visibleByView" :title="'操作日志信息'" @cancel="visibleByView = false">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="日志编号" name="id">
              {{ detailForm.id }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="operate_status">
              <a-tag :color="+detailForm.operate_status ? 'success' : 'error'">
                {{ ['失败', '正常'][+detailForm.operate_status] }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="业务类型" name="operate_type">
              {{ detailForm.title }} /
              <DictTag :options="dict.sysBusinessType" :value="detailForm.operate_type" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作人员" name="create_by">
              {{ detailForm.create_by }} / {{ detailForm.operate_ip }} /
              {{ detailForm.operate_location }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求地址" name="operate_url">
              {{ detailForm.operate_method }}
              {{ detailForm.operate_url }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作时间" name="create_time">
              <span v-if="+detailForm.create_time > 0">
                {{ parseDateToStr(+detailForm.create_time) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求耗时" name="operate_cost_time">
              {{ detailForm.operate_cost_time }} ms
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作方法" name="operate_function">
              {{ detailForm.operate_function }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="请求参数" name="operate_param" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="detailForm.operate_param" :auto-size="{ minRows: 2, maxRows: 6 }" placeholder="请求参数"
            :disabled="true" />
        </a-form-item>
        <a-form-item label="操作信息" name="operate_msg" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="detailForm.operate_msg" :auto-size="{ minRows: 2, maxRows: 6 }" placeholder="操作信息"
            :disabled="true" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="visibleByView = false">关闭</a-button>
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
