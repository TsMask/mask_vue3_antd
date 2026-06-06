<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, toRaw } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "ant-design-vue/es/table";
import {
  exportType,
  listType,
  getType,
  delType,
  addType,
  updateType,
  refreshCache,
} from "@/api/system/dict/type";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { MENU_PATH_INLINE } from "@/constants/menu-constants";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useListQuery } from "@/hooks/useListQuery";
import { useAction, confirmAction } from "@/hooks/useAction";

const route = useRoute();
const router = useRouter();
const routePath = route.path;

const title = ref<string>(route.meta.title ?? "标题");

const { dict } = useDictSetup({ keyMap: { sysNormalDisable: "sys_normal_disable", } });

const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

const { queryParams, handleQuery, resetQuery: baseResetQuery } = useQueryParams(
  {
    dictName: "",
    dictType: "",
    dataLabel: "",
    statusFlag: undefined as string | undefined,
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
    queryParams.beginTime = queryRangePicker.value[0].startOf("day").valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf("day").valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
}

const {
  tableState,
  setTableSize,
  rowClassName,
  setSelectedRowKeys,
} = useTableUI();

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
  queryFn: () => { syncDateRange(); return listType(toRaw(queryParams)); },
});

const {
  modal: modalState,
  formCtl: modalStateForm,
  openView,
  openEdit,
  close: handleCancel,
} = useCrudModal({
  initForm: () => ({
    dictId: undefined as string | number | undefined,
    dictName: "",
    dictType: undefined as string | undefined,
    statusFlag: "0",
    remark: undefined as string | undefined,
  }),
  rules: {
    dictName: [{ required: true, min: 1, max: 50, message: "请输入字典名称" }],
    dictType: [{ required: true, min: 1, max: 50, message: "请输入字典类型" }],
  },
});

/** 新增/编辑 mutation */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form: Record<string, any>) =>
    form.dictId ? updateType(form) : addType(form),
  successText: "操作成功",
  onSuccess() {
    handleCancel();
    fetchList();
  },
});

const tableColumns: ColumnsType = [
  { title: "字典编号", dataIndex: "dictId", align: "left", width: 100 },
  { title: "字典名称", dataIndex: "dictName", align: "left", width: 200 },
  { title: "字典类型", dataIndex: "dictType", align: "left", width: 200 },
  { title: "字典状态", dataIndex: "statusFlag", key: "statusFlag", align: "left", width: 100 },
  {
    title: "创建时间", dataIndex: "createTime", align: "left", width: 150,
    customRender(opt) { if (+opt.value <= 0) return ""; return parseDateToStr(+opt.value); },
  },
  { title: "操作", key: "dictId", align: "left" },
];

function handleView(dictId: string | number) {
  openView(dictId, getType, "字典类型信息");
}

function handleEdit(dictId?: string | number) {
  openEdit(dictId, getType, "添加字典类型", "修改字典类型");
}

async function handleSubmit() {
  try {
    await modalStateForm.validate();
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  await submitExecute(toRaw(modalState.form));
}

function handleDelete(dictId: string = "0") {
  if (dictId === "0") {
    dictId = tableState.selectedRowKeys.join(",");
  }
  confirmAction({
    content: `确认删除字典编号为【${dictId}】的数据项?`,
    action: () => delType(dictId),
    variables: undefined,
    successText: "删除成功",
    onSuccess() {
      const deletedCount = String(dictId).split(",").length;
      if (!clampPage(deletedCount)) fetchList();
    },
  });
}

function handleExport() {
  confirmAction({
    content: "确认根据搜索条件导出xlsx表格文件吗",
    action: () => exportType(toRaw(queryParams)),
    variables: undefined,
    successText: "已导出完成",
    onSuccess: (res) => saveAs(res.data, `dict_${Date.now()}.xlsx`),
  });
}

function handleRefreshCache() {
  confirmAction({
    content: "确定要刷新字典数据缓存吗?",
    action: () => refreshCache(),
    variables: undefined,
    successText: "刷新缓存成功",
  });
}

function handleDataView(dictId: string | number = "0") {
  router.push(`${routePath}${MENU_PATH_INLINE}/data/${dictId}`);
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        数据字典类型，数据名称对应的代码值映射数据。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="字典名称" name="dictName">
              <a-input v-model:value="queryParams.dictName" allow-clear placeholder="请输入字典名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dataLabel">
              <a-input v-model:value="queryParams.dataLabel" allow-clear placeholder="请输入数据标签"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="字典状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择"
                :options="dict.sysNormalDisable">
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
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:dict:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:dict:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button type="default" @click.prevent="handleDataView()" v-perms:has="['system:dict:data']">
            <template #icon>
              <ContainerOutlined />
            </template>
            字典数据
          </a-button>
          <a-button type="dashed" danger @click.prevent="handleRefreshCache" v-perms:has="['system:dict:remove']">
            <template #icon>
              <SyncOutlined />
            </template>
            刷新缓存
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:dict:export']">
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

      <a-table class="antdv-table" row-key="dictId" :columns="tableColumns" :loading="loading" :data-source="listData"
        :size="tableState.size" :row-class-name="rowClassName" :pagination="{ ...pagination }" :scroll="{
          x: tableColumns.length * 120, scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox', selectedRowKeys: tableState.selectedRowKeys, onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysNormalDisable" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'dictId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.dictId)" v-perms:has="['system:dict:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleEdit(record.dictId)" v-perms:has="['system:dict:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.dictId)" v-perms:has="['system:dict:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>字典数据</template>
                <a-button type="link" @click.prevent="handleDataView(record.dictId)" v-perms:has="['system:dict:data']">
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
    <ProModal :drag="true" :width="800" :open="modalState.visibleByView" :title="modalState.title"
      @cancel="handleCancel">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典编号" name="dictId">{{ modalState.form.dictId }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典状态" name="statusFlag">
              <DictTag :options="dict.sysNormalDisable" :value="modalState.form.statusFlag" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典名称" name="dictName">{{ modalState.form.dictName }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType">{{ modalState.form.dictType }}</a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="字典说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
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
      :open="modalState.visibleByEdit" :title="modalState.title" :confirm-loading="isSubmitting" @ok="handleSubmit"
      @cancel="handleCancel">
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 3 }" :label-wrap="true">
        <a-form-item label="字典名称" name="dictName" v-bind="modalStateForm.validateInfos.dictName">
          <a-input v-model:value="modalState.form.dictName" allow-clear placeholder="请输入字典名称" :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="字典类型" name="dictType" v-bind="modalStateForm.validateInfos.dictType">
          <a-input v-model:value="modalState.form.dictType" allow-clear placeholder="请输入字典类型" :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="字典状态" name="statusFlag">
          <a-select v-model:value="modalState.form.statusFlag" default-value="0" placeholder="字典状态"
            :options="dict.sysNormalDisable">
          </a-select>
        </a-form-item>
        <a-form-item label="字典说明" name="remark">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入参数说明" />
        </a-form-item>
      </a-form>
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