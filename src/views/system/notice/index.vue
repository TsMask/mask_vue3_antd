<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, computed } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from "antdv-pro-table";
import {
  listNotice,
  getNotice,
  delNotice,
  addNotice,
  updateNotice,
} from "@/api/system/notice";
import { parseDateToStr } from "@/utils/date-utils";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useAction, confirmAction } from "@/hooks/useAction";
import { toProValueEnum, useProTable, useProTableScroll } from "@/hooks/useProTable";

const route = useRoute();

/** 路由标题 */
const title = ref<string>(route.meta.title ?? "标题");

/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: {
    sysNoticeType: "sys_notice_type",
    sysNoticeStatus: "sys_notice_status",
  }
});

/** 列表数据查询 */
const {
  dataSource,
  loading,
  pagination,
  onSearch,
  onReset,
  onTableChange,
  reload,
  rowSelection, selectedRowKeys, removeSelectedRowKeys
} = useProTable({
  queryFn: listNotice,
  defaultPageSize: 20,
  rowKey: "id"
});

/** CRUD 弹窗管理 */
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
    notice_title: "",
    notice_content: "",
    notice_type: "2",
    notice_status: "1",
    delFlag: "0",
    remark: "",
    create_by: undefined,
    create_time: undefined,
    update_by: undefined,
    update_time: undefined,
  }),
  rules: {
    notice_title: [
      { required: true, min: 2, max: 50, message: "请输入公告标题" },
    ],
    notice_type: [{ required: true, message: "请选择公告类型" }],
    notice_content: [
      {
        required: true,
        min: 2,
        max: 3000,
        message: "请输入公告内容，长度2-3000个字符",
      },
    ],
  },
});

/** 新增/编辑 mutation */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form: Record<string, any>) =>
    form.id ? updateNotice(form) : addNotice(form),
  successText: "操作成功",
  onSuccess() {
    handleCancel();
    reload();
  },
});

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: "公告编号", dataIndex: "id", align: "left", width: 100 },
  { title: "公告标题", dataIndex: "notice_title", align: "left", width: 300 },
  {
    title: "公告类型",
    dataIndex: "notice_type",
    key: "notice_type",
    align: "left",
    width: 100,
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNoticeType),
  },
  {
    title: "状态",
    dataIndex: "notice_status",
    key: "notice_status",
    align: "left",
    width: 100,
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNoticeStatus),
  },
  { title: "创建者", dataIndex: "create_by", align: "left", width: 100 },
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
  { title: "公告标题", dataIndex: "notice_title" },
  {
    title: "公告类型",
    dataIndex: "notice_type",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNoticeType),
  },
  {
    title: "状态",
    dataIndex: "notice_status",
    valueType: "select",
    valueEnum: toProValueEnum(dict.sysNoticeStatus),
  },
  { title: "创建者", dataIndex: "create_by" },
]);

/** 打开公告详情弹窗 */
function handleView(id: string | number) {
  openView(id, getNotice, "公告信息");
}

/** 打开新增或编辑弹窗 */
function handleEdit(id?: string | number) {
  openEdit(id, getNotice, "添加公告", "修改公告");
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
  submitExecute(form);
}

/** 删除公告（单条或批量） */
function handleDelete(id: string = "0") {
  if (id === "0") {
    id = selectedRowKeys.value.join(",");
  }
  confirmAction({
    content: `确认删除公告编号为【${id}】的数据项?`,
    action: (id) => delNotice(id),
    variables: id,
    successText: "删除成功",
    onSuccess() {
      removeSelectedRowKeys(String(id).split(",").map(Number));
      reload();
    },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        发布公告给内部用户的通知。
      </a-typography-paragraph>
    </template>

    <ProTable row-key="id" :columns="tableColumns" :data-source="dataSource" :loading="loading" :pagination="pagination"
      :row-selection="rowSelection" :scroll="tableScroll" @change="onTableChange"
      :search="{ columns: searchColumns, onSearch, onReset }" :toolbar="{
        setting: { columnsStateKey: 'system-notice', columnsStateType: 'local' },
        onReload: reload,
      }">
      <template #toolBarRender>

        <a-space :size="8" align="center" :style="{ flexWrap: 'wrap', marginBottom: '8px' }">
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:notice:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="selectedRowKeys.length <= 0" @click.prevent="handleDelete()"
            v-perms:has="['system:notice:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">

        <template v-if="column.key === 'notice_type'">
          <DictTag :options="dict.sysNoticeType" :value="record.notice_type" />
        </template>
        <template v-if="column.key === 'notice_status'">
          <DictTag :options="dict.sysNoticeStatus" :value="record.notice_status" />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button type="link" @click.prevent="handleView(record.id)" v-perms:has="['system:notice:query']">
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button type="link" @click.prevent="handleEdit(record.id)" v-perms:has="['system:notice:edit']">
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button type="link" @click.prevent="handleDelete(record.id)" v-perms:has="['system:notice:remove']">
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
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告类型" name="notice_type" v-bind="modalStateForm.validateInfos.notice_type">
              <a-select v-model:value="modalState.form.notice_type" default-value="1" placeholder="公告类型"
                :options="dict.sysNoticeType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告状态" name="notice_status">
              <a-select v-model:value="modalState.form.notice_status" default-value="0" placeholder="公告状态"
                :options="dict.sysNoticeStatus">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="公告标题" name="notice_title" v-bind="modalStateForm.validateInfos.notice_title"
          :label-col="{ span: 3 }" :label-wrap="true">
          <a-input v-model:value="modalState.form.notice_title" allow-clear placeholder="请输入公告标题"
            :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="公告内容" name="notice_content" v-bind="modalStateForm.validateInfos.notice_content"
          :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.notice_content" :auto-size="{ minRows: 4, maxRows: 14 }"
            :maxlength="3000" :show-count="!isView" placeholder="请输入公告内容" />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
