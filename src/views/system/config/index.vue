<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, computed, onMounted } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "ant-design-vue/es/table";
import {
  exportConfig,
  listConfig,
  getConfig,
  delConfig,
  addConfig,
  updateConfig,
  refreshConfig,
} from "@/api/system/config";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useListQuery } from "@/hooks/useListQuery";
import { useMutationAction, confirmAndRun } from "@/hooks/useMutationAction";

const route = useRoute();
const queryClient = useQueryClient();

/** 路由标题 */
const title = ref<string>(route.meta.title ?? "标题");

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysYesNo: "sys_yes_no",
});

/** 时间范围选择器 */
const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/** 查询参数 */
const { queryParams, resetQuery: baseResetQuery } = useQueryParams(
  {
    configName: "",
    configKey: "",
    configType: undefined as string | undefined,
    beginTime: undefined as number | undefined,
    endTime: undefined as number | undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
  },
);

/** 重置查询条件，清空日期选择器后恢复默认参数 */
function resetQuery() {
  queryRangePicker.value = undefined;
  baseResetQuery();
}

/** 同步日期范围到查询参数 */
function syncDateRange() {
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.beginTime = queryRangePicker.value[0].startOf("day").valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf("day").valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
}

/** 分页管理 */
const { pagination, resetPage } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
  },
});

/** 列表数据查询 */
const { listData, total, isFetching, refetch } = useListQuery({
  queryKey: computed(() => {
    syncDateRange();
    return ["configList", { ...queryParams }];
  }),
  queryFn: () => listConfig(toRaw(queryParams)),
});

/** 表格UI状态 */
const {
  tableState,
  setTableSize,
  rowClassName,
  setSelectedRowKeys,
} = useTableUI();

/** CRUD 弹窗管理 */
const {
  modal: modalState,
  formCtl: modalStateForm,
  openView,
  openEdit,
  close: handleCancel,
} = useCrudModal({
  initForm: () => ({
    configId: undefined as string | number | undefined,
    configName: "",
    configKey: "",
    configValue: "",
    configType: "N",
    remark: undefined as string | undefined,
  }),
  rules: {
    configName: [
      { required: true, min: 1, max: 50, message: "请输入参数名称" },
    ],
    configKey: [
      { required: true, min: 1, max: 50, message: "请输入参数键名" },
    ],
    configValue: [
      { required: true, min: 1, max: 50, message: "请输入参数键值" },
    ],
  },
});

/** 新增/编辑 mutation */
const { mutate: submitMutate, isLoading: isSubmitting } = useMutationAction({
  mutationFn: (form: Record<string, any>) =>
    form.configId ? updateConfig(form) : addConfig(form),
  successText: "操作成功",
  invalidateKeys: [["configList"]],
  onSuccess() {
    handleCancel();
    queryParams.pageNum = 1;
  },
});

/** 表格字段列 */
const tableColumns: ColumnsType = [
  { title: "参数编号", dataIndex: "configId", align: "left", width: 100 },
  { title: "参数名称", dataIndex: "configName", align: "left", width: 200 },
  { title: "参数键名", dataIndex: "configKey", align: "left", width: 200 },
  { title: "参数键值", dataIndex: "configValue", align: "left", width: 100 },
  {
    title: "系统内置",
    dataIndex: "configType",
    key: "configType",
    align: "left",
    width: 100,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    align: "left",
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return "";
      return parseDateToStr(+opt.value);
    },
  },
  { title: "操作", key: "configId", align: "left" },
];

/** 打开参数配置详情弹窗 */
function handleView(configId: string | number) {
  openView(configId, getConfig, "参数配置信息");
}

/** 打开新增或编辑弹窗 */
function handleEdit(configId?: string | number) {
  openEdit(configId, getConfig, "添加参数配置", "修改参数配置");
}

/** 校验表单后提交新增/编辑 */
async function handleSubmit() {
  try {
    await modalStateForm.validate();
  } catch (e: any) {
    message.error({
      content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }
  const form = toRaw(modalState.form);
  submitMutate(form);
}

/** 删除参数配置（单条或批量） */
function handleDelete(configId: string = "0") {
  if (configId === "0") {
    configId = tableState.selectedRowKeys.join(",");
  }
  confirmAndRun({
    content: `确认删除参数编号为【${configId}】的数据项?`,
    action: (id) => delConfig(id),
    variables: configId,
    successText: "删除成功",
    invalidateKeys: [["configList"]],
  });
}

/** 导出参数配置列表 */
function handleExport() {
  confirmAndRun({
    content: "确认根据搜索条件导出xlsx表格文件吗",
    action: () => exportConfig(toRaw(queryParams)),
    variables: undefined as any,
    successText: "已导出完成",
    onSuccess: (res) => {
      saveAs(res.data, `config_${Date.now()}.xlsx`);
    },
  });
}

/** 刷新系统参数配置缓存 */
function handleRefreshConfig() {
  confirmAndRun({
    content: "确定要刷新参数配置缓存吗?",
    action: () => refreshConfig(),
    variables: undefined as any,
    successText: "刷新缓存成功",
  });
}

onMounted(() => {
  loadDicts();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        系统内可配置的参数变量。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="参数名称" name="configName">
              <a-input v-model:value="queryParams.configName" allow-clear placeholder="请输入参数名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="参数键名" name="configKey">
              <a-input v-model:value="queryParams.configKey" allow-clear placeholder="请输入参数键名"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="系统内置" name="configType">
              <a-select v-model:value="queryParams.configType" allow-clear placeholder="请选择" :options="dict.sysYesNo">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="8" :md="12" :xs="24">
            <a-form-item label="创建时间" name="queryRangePicker">
              <a-range-picker v-model:value="queryRangePicker" :bordered="true" :allow-clear="true"
                style="width: 100%"></a-range-picker>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="refetch">
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
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:config:add']">
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:config:remove']">
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button type="dashed" danger @click.prevent="handleRefreshConfig" v-perms:has="['system:config:remove']">
            <template #icon><SyncOutlined /></template>
            刷新缓存
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:config:export']">
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
        </a-space>
      </template>

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
            <a-button type="text" @click.prevent="refetch">
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

      <a-table class="table" row-key="configId" :columns="tableColumns" :loading="isFetching"
        :data-source="listData" :size="tableState.size" :row-class-name="rowClassName" :pagination="pagination"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'configType'">
            <DictTag :options="dict.sysYesNo" :value="record.configType" />
          </template>
          <template v-if="column.key === 'configId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.configId)"
                  v-perms:has="['system:config:query']">
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleEdit(record.configId)" v-perms:has="['system:config:edit']">
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.configId)"
                  v-perms:has="['system:config:remove']">
                  <template #icon><DeleteOutlined /></template>
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
            <a-form-item label="参数名称" name="configName">
              {{ modalState.form.configName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="系统内置" name="configType">
              <DictTag :options="dict.sysYesNo" :value="modalState.form.configType" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="参数键名" name="configKey">
              {{ modalState.form.configKey }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="参数键值" name="configValue">
              {{ modalState.form.configValue }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="参数说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="modalState.visibleByEdit" :title="modalState.title" :confirm-loading="isSubmitting"
      @ok="handleSubmit" @cancel="handleCancel">
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="参数名称" name="configName" v-bind="modalStateForm.validateInfos.configName">
              <a-input v-model:value="modalState.form.configName" allow-clear placeholder="请输入参数名称"
                :maxlength="45"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="系统内置" name="configType">
              <a-select v-model:value="modalState.form.configType" default-value="N" placeholder="系统内置"
                :options="dict.sysYesNo">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="参数键名" name="configKey" v-bind="modalStateForm.validateInfos.configKey">
              <a-input v-model:value="modalState.form.configKey" allow-clear placeholder="请输入参数键名"
                :maxlength="45"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="参数键值" name="configValue" v-bind="modalStateForm.validateInfos.configValue">
              <a-input v-model:value="modalState.form.configValue" allow-clear placeholder="请输入参数键值"
                :maxlength="45"></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="参数说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入参数说明" />
        </a-form-item>
      </a-form>
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