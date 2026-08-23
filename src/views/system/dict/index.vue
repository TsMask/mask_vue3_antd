<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed, ref, toRaw } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from "antdv-pro-table";
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
import { useCrudModal } from "@/hooks/useCrudModal";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useAction, confirmAction } from "@/hooks/useAction";
import { toProValueEnum, useProTable, useProTableScroll } from "@/hooks/useProTable";

const route = useRoute();
const router = useRouter();
const routePath = route.path;

const title = ref<string>(route.meta.title ?? "标题");

const { dict } = useDictSetup({ keyMap: { sysNormalDisable: "sys_normal_disable", } });

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
  rowSelection, selectedRowKeys, removeSelectedRowKeys
} = useProTable({
  queryFn: listType,
  defaultPageSize: 20,
  rowKey: "id"
});

const {
  modal: modalState,
  formCtl: modalStateForm,
  isView,
  openView,
  openEdit,
  close: handleCancel,
} = useCrudModal({
  initForm: () => ({
    id: undefined as string | number | undefined,
    dict_name: "",
    dict_type: undefined as string | undefined,
    dict_status: "0",
    remark: undefined as string | undefined,
  }),
  rules: {
    dict_name: [{ required: true, min: 1, max: 50, message: "请输入字典名称" }],
    dict_type: [{ required: true, min: 1, max: 50, message: "请输入字典类型" }],
  },
});

/** 新增/编辑 mutation */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form: Record<string, any>) =>
    form.id ? updateType(form) : addType(form),
  successText: "操作成功",
  onSuccess() {
    handleCancel();
    reload();
  },
});

const tableColumns = computed<ProColumns[]>(() => [
  { title: "字典编号", dataIndex: "id", align: "left", width: 100 },
  { title: "字典名称", dataIndex: "dict_name", align: "left", width: 200 },
  { title: "字典类型", dataIndex: "dict_type", align: "left", width: 200 },
  {
    title: "字典状态",
    dataIndex: "dict_status",
    key: "dict_status",
    align: "left",
    width: 100,
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: "创建时间",
    dataIndex: "create_time",
    align: "left",
    width: 150,
    renderText: value => (+value <= 0 ? "" : parseDateToStr(+value)),
  },
  { title: "操作", key: "operation", align: "left", width: 130 },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: "字典名称", dataIndex: "dict_name" },
  { title: "数据标签", dataIndex: "data_label" },
  {
    title: "字典状态",
    dataIndex: "dict_status",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: "创建时间范围",
    dataIndex: "create_time",
    valueType: "dateTimeRange",
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        create_time_begin: value?.[0]?.valueOf(),
        create_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

function handleView(id: string | number) {
  openView(id, getType, "字典类型信息");
}

function handleEdit(id?: string | number) {
  openEdit(id, getType, "添加字典类型", "修改字典类型");
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

function handleDelete(id: string = "0") {
  if (id === "0") {
    id = selectedRowKeys.value.join(",");
  }
  confirmAction({
    content: `确认删除字典编号为【${id}】的数据项?`,
    action: () => delType(id),
    variables: undefined,
    successText: "删除成功",
    onSuccess() {
      removeSelectedRowKeys(String(id).split(",").map(Number));
      reload();
    },
  });
}

function handleExport() {
  confirmAction({
    content: "确认根据搜索条件导出数据文件吗",
    action: () => {
      return exportType({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    variables: undefined,
    successText: "已导出完成",
    onSuccess: (res) => saveAs(res.data, `dict_${Date.now()}.csv`),
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

function handleDataView(id: string | number = "0") {
  router.push(`${routePath}${MENU_PATH_INLINE}/data/${id}`);
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        数据字典类型，数据名称对应的代码值映射数据。
      </a-typography-paragraph>
    </template>

    <ProTable row-key="id" :columns="tableColumns" :data-source="dataSource" :loading="loading" :pagination="pagination"
      :row-selection="rowSelection" @change="onTableChange" :scroll="tableScroll"
      :search="{ columns: searchColumns, labelWidth: 100, labelWrap: true, onSearch, onReset }" :toolbar="{
        setting: { columnsStateKey: 'system-dict', columnsStateType: 'local' },
        onReload: reload,
      }">
      <template #toolBarRender>
        <a-space :size="8" align="center" :style="{ flexWrap: 'wrap', marginBottom: '8px' }">
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:dict:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="selectedRowKeys.length <= 0" @click.prevent="handleDelete()"
            v-perms:has="['system:dict:remove']">
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

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dict_status'">
          <DictTag :options="dict.sysNormalDisable" :value="record.dict_status" />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button type="link" @click.prevent="handleView(record.id)" v-perms:has="['system:dict:query']">
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button type="link" @click.prevent="handleEdit(record.id)" v-perms:has="['system:dict:edit']">
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button type="link" @click.prevent="handleDelete(record.id)" v-perms:has="['system:dict:remove']">
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>字典数据</template>
              <a-button type="link" @click.prevent="handleDataView(record.id)" v-perms:has="['system:dict:data']">
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
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="!isView" :mask-closable="isView"
      :open="modalState.visible" :title="modalState.title" :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined" @ok="handleSubmit" @cancel="handleCancel">
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 3 }" :label-wrap="true" :disabled="isView">
        <a-form-item v-if="isView" label="字典编号" name="id">
          {{ modalState.form.id }}
        </a-form-item>
        <a-form-item label="字典名称" name="dict_name" v-bind="modalStateForm.validateInfos.dict_name">
          <a-input v-model:value="modalState.form.dict_name" allow-clear placeholder="请输入字典名称"
            :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="字典类型" name="dict_type" v-bind="modalStateForm.validateInfos.dict_type">
          <a-input v-model:value="modalState.form.dict_type" allow-clear placeholder="请输入字典类型"
            :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="字典状态" name="dict_status">
          <a-select v-model:value="modalState.form.dict_status" default-value="0" placeholder="字典状态"
            :options="dict.sysNormalDisable">
          </a-select>
        </a-form-item>
        <a-form-item label="字典说明" name="remark">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="!isView" placeholder="请输入参数说明" />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
