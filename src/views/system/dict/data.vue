<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, reactive, toRaw, computed, onMounted } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from "antdv-pro-table";
import {
  exportData,
  listData,
  getData,
  delData,
  addData,
  updateData,
} from "@/api/system/dict/data";
import { getDictOption, getType } from "@/api/system/dict/type";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { useTabsView } from "@/layouts/hooks/useTabsView";
import useDictStore from "@/store/modules/dict";
import { isSuccess } from "@/plugins/http-fetch";
import { useModalForm } from "@/hooks/useModalForm";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useModalAction } from "@/hooks/useModalAction";
import { toProValueEnum, useProTable, useProTableScroll } from "@/hooks/useProTable";

const { closeTab } = useTabsView();
const { parseDataDict } = useDictStore();
const route = useRoute();
const router = useRouter();
const dict_id = route.params && (route.params.dictId as string);
const defaultDictType = ref<string>();

const tagTypeOptions = ref([
  { value: "", label: "普通文本" },
  { value: "default", label: "默认（default）" },
  { value: "blue ", label: "蓝色（blue）" },
  { value: "cyan", label: "青色（cyan）" },
  { value: "gold", label: "金色（gold）" },
  { value: "green", label: "绿色（green）" },
  { value: "lime", label: "亮绿（lime）" },
  { value: "magenta", label: "紫红（magenta）" },
  { value: "orange", label: "橙黄（orange）" },
  { value: "pink", label: "粉色（pink）" },
  { value: "purple", label: "紫色（purple）" },
  { value: "red", label: "红色（red）" },
  { value: "yellow", label: "黄色（yellow）" },
  { value: "geekblue", label: "深蓝（geekblue）" },
  { value: "volcano", label: "棕色（volcano）" },
  { value: "processing", label: "进行（processing）" },
  { value: "warning", label: "警告（warning）" },
  { value: "error", label: "错误（error）" },
  { value: "success", label: "成功（success）" },
]);

const { dict: sysDict } = useDictSetup({ keyMap: { sysNormalDisable: "sys_normal_disable", } });

const dict = reactive({
  sysNormalDisable: [] as DictType[],
  sysDictType: [] as DictType[],
});

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
  queryFn: listData,
  defaultPageSize: 20,
  manual: true,
  rowKey: "id"
});

const {
  modal: modalState,
  formCtl: modalStateForm,
  isView,
  openModal,
  closeModal: handleCancel,
} = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined,
    dict_type: undefined as string | undefined,
    data_label: "",
    data_sort: 0,
    data_value: "",
    tag_class: "",
    tag_type: "",
    remark: "",
    data_status: "0",
    create_time: 0,
    create_by: undefined,
  }),
  rules: {
    dict_type: [{ required: true, message: "请选择字典类型" }],
    data_label: [{ required: true, min: 1, max: 50, message: "请输入数据标签" }],
    data_value: [{ required: true, min: 1, max: 50, message: "请输入数据键值" }],
  },
});

/** 新增/编辑提交状态 */
const { confirmAction, executeAction, loading: isSubmitting } = useModalAction();

const tableColumns = computed<ProColumns[]>(() => [
  { title: "数据编号", dataIndex: "id", align: "left", width: 100 },
  { title: "数据标签", dataIndex: "data_label", align: "left", width: 200 },
  { title: "数据键值", dataIndex: "data_value", align: "left", width: 200 },
  { title: "数据排序", dataIndex: "data_sort", align: "left", width: 100 },
  {
    title: "数据状态",
    dataIndex: "data_status",
    key: "data_status",
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
  {
    title: "字典类型",
    dataIndex: "dict_type",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysDictType),
    fieldProps: { showSearch: true, disabled: !!defaultDictType },
  },
  { title: "操作", key: "operation", align: "left", width: 130 },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  {
    title: "字典类型",
    dataIndex: "dict_type",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysDictType),
    defaultValue: defaultDictType.value,
    fieldProps: { showSearch: true },
  },
  { title: "数据标签", dataIndex: "data_label" },
  {
    title: "数据状态",
    dataIndex: "data_status",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

/** 直接从行数据打开字典数据详情弹窗（无需再次请求接口） */
function handleView(row: Record<string, string>) {
  openModal({
    mode: "view",
    title: "字典数据信息",
    initialData: row,
  });
}

/** 打开新增或编辑弹窗 */
function handleEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: "edit",
          title: "修改字典数据",
          fetchDetail: () => getData(id),
        }
      : {
          mode: "add",
          title: "添加字典数据",
          beforeOpen(form) {
            form.dict_type = searchValues.value.dict_type ?? defaultDictType.value;
          },
        }
  );
}

async function handleSubmit() {
  try {
    await modalStateForm.validate();
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  const form = toRaw(modalState.form);
  await executeAction({
    action: () => form.id ? updateData(form) : addData(form),
    successText: "操作成功",
    onSuccess() {
      handleCancel();
      reload();
    },
  });
}

function handleDelete(id: string = "0") {
  if (id === "0") {
    id = selectedRowKeys.value.join(",");
  }
  confirmAction({
    content: `确认删除字典数据编号为【${id}】的数据项?`,
    action: () => delData(id),
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
    action: () => exportData({
      ...toRaw(searchValues.value),
      page_num: current.value,
      page_size: pageSize.value,
    }),
    successText: "已导出完成",
    onSuccess: (res) => saveAs(res.data, `dict_data_${Date.now()}.csv`),
  });
}

function handleClose() {
  const to = closeTab(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}

onMounted(async () => {
  const optRes = await getDictOption();
  if (isSuccess(optRes)) {
    dict.sysDictType = optRes.data;
    dict.sysNormalDisable = sysDict.sysNormalDisable;
  }
  if (dict_id && dict_id !== "0") {
    const res = await getType(dict_id);
    if (isSuccess(res) && res.data) {
      defaultDictType.value = res.data.dict_type;
    } else {
      message.error({ content: "获取字典类型信息失败", duration: 3 });
    }
  }
  await onSearch(
    defaultDictType.value ? { dict_type: defaultDictType.value } : {}
  );
});
</script>

<template>
  <PageContainer>
    <template #content>
      <a-typography-paragraph>
        字典数据按类型分类，每个字典类型下包含多个数据项，每个数据项都有一个唯一的键值对，映射数据。
      </a-typography-paragraph>
    </template>

    <ProTable row-key="id" :columns="tableColumns" :data-source="dataSource" :loading="loading" :pagination="pagination"
      :row-selection="rowSelection" @change="onTableChange" :scroll="tableScroll"
      :search="{ columns: searchColumns, onSearch, onReset }" :toolbar="{
        setting: { columnsStateKey: 'system-dict-data', columnsStateType: 'local' },
        onReload: reload,
      }">
      <template #toolBarRender>
        <a-space :size="8" align="center" :style="{ flexWrap: 'wrap', marginBottom: '8px' }">
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon>
              <CloseOutlined />
            </template>
            关闭
          </a-button>
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:dict:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新增
          </a-button>
          <a-button type="default" danger :disabled="selectedRowKeys.length <= 0" @click.prevent="handleDelete()"
            v-perms:has="['system:dict:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
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
        <template v-if="column.key === 'data_status'">
          <DictTag :options="dict.sysNormalDisable" :value="record.data_status" />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button type="link" @click.prevent="handleView(record)" v-perms:has="['system:dict:query']">
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
          </a-space>
        </template>
      </template>
    </ProTable>

    <!-- 详情框或新增修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="!isView" :mask-closable="isView"
      :open="modalState.visible" :title="modalState.title" :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined" @ok="handleSubmit" @cancel="handleCancel">
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true" :disabled="isView">
        <a-row v-if="isView">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据编号" name="id">{{ modalState.form.id }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="create_time">
              <span v-if="+modalState.form.create_time > 0">{{ parseDateToStr(+modalState.form.create_time) }}</span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dict_type" v-bind="modalStateForm.validateInfos.dict_type">
              <a-select v-model:value="modalState.form.dict_type" placeholder="字典类型" :options="dict.sysDictType"
                :disabled="dict_id !== '0'">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据状态" name="data_status">
              <a-select v-model:value="modalState.form.data_status" default-value="0" placeholder="数据状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据标签" name="data_label" v-bind="modalStateForm.validateInfos.data_label">
              <a-input v-model:value="modalState.form.data_label" allow-clear placeholder="请输入数据标签"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据键值" name="data_value" v-bind="modalStateForm.validateInfos.data_value">
              <a-input v-model:value="modalState.form.data_value" allow-clear placeholder="请输入数据键值"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="标签类型" name="tag_type">
              <a-select v-model:value="modalState.form.tag_type" placeholder="标签类型" :options="tagTypeOptions">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="data_sort">
              <a-input-number v-model:value="modalState.form.data_sort" :min="0" :max="9999" :step="1"
                placeholder="请输入数据排序"></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="样式属性" name="tag_class" :label-col="{ span: 3 }" :label-wrap="true">
          <a-input v-model:value="modalState.form.tag_class" allow-clear placeholder="请输入样式属性"
            :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item v-if="isView" label="回显预览" name="tag_type" :label-col="{ span: 3 }" :label-wrap="true">
          <DictTag :options="parseDataDict(modalState.form)" :value="modalState.form.data_value" />
        </a-form-item>
        <a-form-item label="数据说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="!isView" placeholder="请输入数据说明" />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
