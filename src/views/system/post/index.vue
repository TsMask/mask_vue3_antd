<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed, ref, toRaw } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from "antdv-pro-table";
import { exportPost, listPost, addPost, delPost, getPost, updatePost } from "@/api/system/post";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { useModalForm } from "@/hooks/useModalForm";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useModalAction } from "@/hooks/useModalAction";
import { toProValueEnum, useProTable, useProTableScroll } from "@/hooks/useProTable";

const route = useRoute();
const title = ref<string>(route.meta.title ?? "标题");

const { dict } = useDictSetup({ keyMap: { sysNormalDisable: "sys_normal_disable" } });

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
  queryFn: listPost,
  defaultPageSize: 20,
  rowKey: "id"
});

const { modal: modalState, formCtl: modalStateForm, isView, openModal, closeModal: handleCancel } = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined, post_code: "", post_name: "", post_sort: 0, post_status: "0", remark: undefined as string | undefined, create_time: 0,
  }),
  rules: {
    post_code: [{ required: true, min: 1, max: 50, message: "请输入岗位编码" }],
    post_name: [{ required: true, min: 1, max: 50, message: "请输入岗位名称" }],
    post_sort: [{ required: true, message: "请输入岗位排序" }],
  },
});

const { confirmAction, executeAction, loading: isSubmitting } = useModalAction();

const tableColumns = computed<ProColumns[]>(() => [
  { title: "岗位编号", dataIndex: "id", align: "left", width: 100 },
  { title: "岗位编码", dataIndex: "post_code", align: "left", width: 200 },
  { title: "岗位名称", dataIndex: "post_name", align: "left", width: 200 },
  { title: "岗位排序", dataIndex: "post_sort", align: "left", width: 100 },
  {
    title: "状态",
    dataIndex: "post_status",
    key: "post_status",
    align: "left",
    width: 100,
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: "创建时间",
    dataIndex: "create_time",
    align: "left",
    width: 200,
    renderText: value => (+value <= 0 ? "" : parseDateToStr(+value)),
  },
  { title: "操作", key: "operation", align: "left", width: 150 },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: "岗位编码", dataIndex: "post_code" },
  { title: "岗位名称", dataIndex: "post_name" },
  {
    title: "状态",
    dataIndex: "post_status",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

function handleView(id: string | number) {
  openModal({
    mode: "view",
    title: "岗位信息",
    fetchDetail: () => getPost(id),
    errorMessage: "获取岗位信息失败",
  });
}

function handleEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: "edit",
          title: "修改岗位",
          fetchDetail: () => getPost(id),
          errorMessage: "获取岗位信息失败",
        }
      : {
          mode: "add",
          title: "添加岗位",
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
    action: () => form.id ? updatePost(form) : addPost(form),
    successText: "操作成功",
    onSuccess() {
      handleCancel();
      reload();
    },
  });
}

function handleDelete(id: string = "0") {
  if (id === "0") id = selectedRowKeys.value.join(",");
  confirmAction({
    content: `确认删除岗位编号为【${id}】的数据项?`,
    action: () => delPost(id),
    successText: "删除成功",
    onSuccess() {
      removeSelectedRowKeys(String(id).split(",").map(item => Number(item)));
      reload();
    },
  });
}

function handleExport() {
  confirmAction({
    content: "确认根据搜索条件导出数据文件吗",
    action: () => exportPost({
      ...toRaw(searchValues.value),
      page_num: current.value,
      page_size: pageSize.value,
    }),
    successText: "已导出完成",
    onSuccess: (res) => { saveAs(res.data, `post_${Date.now()}.csv`); },
  });
}
</script>
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户岗位标记 </a-typography-paragraph>
    </template>

    <ProTable row-key="id" :columns="tableColumns" :data-source="dataSource" :loading="loading" :pagination="pagination"
      :row-selection="rowSelection" :scroll="tableScroll" :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: { columnsStateKey: 'system-post', columnsStateType: 'local' },
        onReload: reload,
      }" @change="onTableChange">
      <template #toolBarRender>
        <a-space :size="8" align="center" :style="{ flexWrap: 'wrap', marginBottom: '8px' }">
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:post:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="selectedRowKeys.length <= 0" @click.prevent="handleDelete()"
            v-perms:has="['system:post:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:post:export']">
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'post_status'">
          <DictTag :options="dict.sysNormalDisable" :value="record.post_status" />
        </template>
        <template v-else-if="column.dataIndex === 'create_time'">
          <span>{{ +record.create_time > 0 ? parseDateToStr(+record.create_time) : '' }}</span>
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button type="link" @click.prevent="handleView(record.id)" v-perms:has="['system:post:query']">
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button type="link" @click.prevent="handleEdit(record.id)" v-perms:has="['system:post:edit']">
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button type="link" @click.prevent="handleDelete(record.id)" v-perms:has="['system:post:remove']">
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
            <a-form-item label="岗位编号" name="id">
              {{ modalState.form.id }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="create_time">
              <span v-if="+modalState.form.create_time > 0">
                {{ parseDateToStr(+modalState.form.create_time) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位编码" name="post_code" v-bind="modalStateForm.validateInfos.post_code">
              <a-input v-model:value="modalState.form.post_code" allow-clear placeholder="请输入岗位编码"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="post_status">
              <a-select v-model:value="modalState.form.post_status" default-value="0" placeholder="岗位状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位名称" name="post_name" v-bind="modalStateForm.validateInfos.post_name">
              <a-input v-model:value="modalState.form.post_name" allow-clear placeholder="请输入岗位名称"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位顺序" name="post_sort">
              <a-input-number v-model:value="modalState.form.post_sort" :min="0" :max="9999" :step="1"
                placeholder="排序值"></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="岗位说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="!isView" placeholder="请输入岗位说明" />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
