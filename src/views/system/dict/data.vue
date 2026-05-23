<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, reactive, toRaw, onMounted } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import type { ColumnsType } from "ant-design-vue/es/table";
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
import useTabsStore from "@/store/modules/tabs";
import useDictStore from "@/store/modules/dict";
import { RESULT_CODE_SUCCESS } from "@/constants/result-constants";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useMessageAction } from "@/hooks/useMessageAction";
import { useDictSetup } from "@/hooks/useDictSetup";

const tabsStore = useTabsStore();
const { parseDataDict } = useDictStore();
const route = useRoute();
const router = useRouter();

const dictId = route.params && (route.params.dictId as string);

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

const { dict: sysDict, loadDicts: loadSysDicts } = useDictSetup({
  sysNormalDisable: "sys_normal_disable",
});

const dict = reactive({
  sysNormalDisable: sysDict.sysNormalDisable,
  sysDictType: [] as DictType[],
});

const { withLoading, confirmAndRun } = useMessageAction();

const { queryParams, resetQuery: baseResetQuery, setQuery } = useQueryParams(
  {
    dictType: undefined as string | undefined,
    dataLabel: "",
    statusFlag: undefined as string | undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/** 重置查询条件；从字典类型页进入时仅重置数据标签和状态，保留 dictType */
function resetQuery() {
  if (dictId && dictId !== "0") {
    setQuery({ dataLabel: "", statusFlag: undefined, pageNum: 1, pageSize: 20 });
    resetPage();
    fetchList();
  } else {
    baseResetQuery();
  }
}

const {
  tableState,
  setTableSize,
  rowClassName,
  setSelectedRowKeys,
  clearSelection,
} = useTableUI({ defaultSize: "middle" });

tableState.seached = true;

const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

const {
  modal: modalState,
  formCtl: modalStateForm,
  openEdit,
  close: handleCancel,
  setForm,
} = useCrudModal({
  initForm: () => ({
    dataId: undefined as string | number | undefined,
    dictType: undefined as string | undefined,
    dataLabel: "",
    dataSort: 0,
    dataValue: "",
    tagClass: "",
    tagType: "",
    remark: "",
    statusFlag: "0",
    createTime: 0,
    createBy: undefined,
  }),
  rules: {
    dictType: [{ required: true, message: "请选择字典类型" }],
    dataLabel: [
      { required: true, min: 1, max: 50, message: "请输入数据标签" },
    ],
    dataValue: [
      { required: true, min: 1, max: 50, message: "请输入数据键值" },
    ],
  },
});

const tableColumns: ColumnsType = [
  { title: "数据编号", dataIndex: "dataId", align: "left", width: 100 },
  { title: "数据标签", dataIndex: "dataLabel", align: "left", width: 200 },
  { title: "数据键值", dataIndex: "dataValue", align: "left", width: 200 },
  { title: "数据排序", dataIndex: "dataSort", align: "left", width: 100 },
  {
    title: "数据状态",
    dataIndex: "statusFlag",
    key: "statusFlag",
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
  { title: "操作", key: "dataId", align: "left" },
];

/** 直接从行数据打开字典数据详情弹窗（无需再次请求接口） */
function handleView(row: Record<string, string>) {
  setForm(row);
  modalState.title = "字典数据信息";
  modalState.visibleByView = true;
}

/** 打开新增或编辑弹窗；新增时自动带入当前 dictType，有 dataId 则回填数据 */
function handleEdit(dataId?: string | number) {
  if (!dataId) {
    openEdit(undefined, getData, "添加字典数据", "修改字典数据");
    setTimeout(() => {
      modalState.form.dictType = queryParams.dictType;
    }, 0);
  } else {
    openEdit(dataId, getData, "添加字典数据", "修改字典数据");
  }
}

/** 校验表单后提交新增/编辑，成功则刷新列表并关闭弹窗 */
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
  modalState.confirmLoading = true;
  try {
    const form = toRaw(modalState.form);
    const res = await withLoading(
      (form.dataId ? updateData : addData)(form),
      { successText: `${modalState.title}成功` },
    );
    if (res.code === RESULT_CODE_SUCCESS) {
      fetchList(1);
      handleCancel();
    }
  } finally {
    modalState.confirmLoading = false;
  }
}

/** 删除字典数据（单条或批量），支持从选中行键列表批量删除 */
function handleDelete(dataId: string = "0") {
  if (dataId === "0") {
    dataId = tableState.selectedRowKeys.join(",");
  }
  confirmAndRun({
    content: `确认删除字典数据编号为【${dataId}】的数据项?`,
    onOk: () => delData(dataId),
    successText: "删除成功",
    onSuccess: () => fetchList(),
  });
}

/** 根据当前搜索条件导出字典数据列表 xlsx 文件 */
function handleExport() {
  confirmAndRun({
    content: "确认根据搜索条件导出xlsx表格文件吗",
    onOk: () => exportData(toRaw(queryParams)),
    successText: "已导出完成",
    onSuccess: (res) => {
      saveAs(res.data, `dict_data_${Date.now()}.xlsx`);
    },
  });
}

/** 关闭当前标签页并跳转回上级页面（字典类型列表） */
function handleClose() {
  const to = tabsStore.tabClose(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}

/** 查询字典数据列表，支持指定页码；删除后自动修正空页 */
async function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  try {
    const res = await listData(toRaw(queryParams));
    if (res.code === RESULT_CODE_SUCCESS) {
      clearSelection();
      setTotal(res.data.total);
      tableState.data = res.data.rows;
      if (fixPageAfterDelete(res.data.rows.length)) {
        queryParams.pageNum = pagination.current;
        const res2 = await listData(toRaw(queryParams));
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

onMounted(async () => {
  loadSysDicts();
  const optRes = await getDictOption();
  if (optRes.code === RESULT_CODE_SUCCESS) {
    dict.sysDictType = optRes.data;
  }

  if (dictId && dictId !== "0") {
    const res = await getType(dictId);
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      queryParams.dictType = res.data.dictType;
      fetchList();
    } else {
      message.error({ content: "获取字典类型信息失败", duration: 3 });
    }
  } else {
    fetchList();
  }
});
</script>

<template>
  <PageContainer>
    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="字典名称" name="dictType">
              <a-select v-model:value="queryParams.dictType" :allow-clear="dictId === '0'" :disabled="dictId !== '0'"
                placeholder="请选择字典名称" :options="dict.sysDictType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dataLabel">
              <a-input v-model:value="queryParams.dataLabel" allow-clear placeholder="请输入数据标签"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="数据状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择数据状态"
                :options="dict.sysNormalDisable">
              </a-select>
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
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon><CloseOutlined /></template>
            关闭
          </a-button>
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:dict:add']">
            <template #icon><PlusOutlined /></template>
            新增
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:dict:remove']">
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:dict:export']">
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

      <a-table class="table" row-key="dataId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysNormalDisable" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'dataId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record)" v-perms:has="['system:dict:query']">
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleEdit(record.dataId)" v-perms:has="['system:dict:edit']">
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.dataId)" v-perms:has="['system:dict:remove']">
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
            <a-form-item label="数据编号" name="dataId">
              {{ modalState.form.dataId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+modalState.form.createTime > 0">
                {{ parseDateToStr(+modalState.form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType">
              <a-select v-model:value="modalState.form.dictType" placeholder="字典类型" :options="dict.sysDictType"
                :disabled="true">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据状态" name="statusFlag">
              <DictTag :options="dict.sysNormalDisable" :value="modalState.form.statusFlag" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dataLabel">
              {{ modalState.form.dataLabel }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据键值" name="dataValue">
              {{ modalState.form.dataValue }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="标签类型" name="tagType">
              <DictTag :options="tagTypeOptions" :value="modalState.form.tagType" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="dataSort">
              {{ modalState.form.dataSort }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="样式属性" name="tagClass">
              {{ modalState.form.tagClass }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="回显预览" name="tagType">
              <DictTag :options="parseDataDict(modalState.form)" :value="modalState.form.dataValue" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="数据说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
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
      :open="modalState.visibleByEdit" :title="modalState.title" :confirm-loading="modalState.confirmLoading"
      @ok="handleSubmit" @cancel="handleCancel">
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType" v-bind="modalStateForm.validateInfos.dictType">
              <a-select v-model:value="modalState.form.dictType" placeholder="字典类型" :options="dict.sysDictType"
                :disabled="dictId !== '0'">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据状态" name="statusFlag">
              <a-select v-model:value="modalState.form.statusFlag" default-value="0" placeholder="数据状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dataLabel" v-bind="modalStateForm.validateInfos.dataLabel">
              <a-input v-model:value="modalState.form.dataLabel" allow-clear placeholder="请输入数据标签"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据键值" name="dataValue" v-bind="modalStateForm.validateInfos.dataValue">
              <a-input v-model:value="modalState.form.dataValue" allow-clear placeholder="请输入数据键值"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="标签类型" name="tagType">
              <a-select v-model:value="modalState.form.tagType" placeholder="标签类型" :options="tagTypeOptions">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="dataSort">
              <a-input-number v-model:value="modalState.form.dataSort" :min="0" :max="9999" :step="1"
                placeholder="请输入数据排序"></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="样式属性" name="tagClass" :label-col="{ span: 3 }" :label-wrap="true">
          <a-input v-model:value="modalState.form.tagClass" allow-clear placeholder="请输入样式属性" :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="数据说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入数据说明" />
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



