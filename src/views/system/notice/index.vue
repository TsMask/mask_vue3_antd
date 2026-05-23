<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, onMounted } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import type { ColumnsType } from "ant-design-vue/es/table";
import {
  listNotice,
  getNotice,
  delNotice,
  addNotice,
  updateNotice,
} from "@/api/system/notice";
import { parseDateToStr } from "@/utils/date-utils";
import { RESULT_CODE_SUCCESS } from "@/constants/result-constants";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useMessageAction } from "@/hooks/useMessageAction";
import { useDictSetup } from "@/hooks/useDictSetup";

const route = useRoute();

const title = ref<string>(route.meta.title ?? "标题");

const { dict, loadDicts } = useDictSetup({
  sysNoticeType: "sys_notice_type",
  sysNoticeStatus: "sys_notice_status",
});

const { withLoading, confirmAndRun } = useMessageAction();

const { queryParams, resetQuery } = useQueryParams(
  {
    noticeTitle: "",
    createBy: undefined as string | undefined,
    noticeType: undefined as string | undefined,
    statusFlag: undefined as string | undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

const {
  tableState,
  setTableSize,
  rowClassName,
  setSelectedRowKeys,
  clearSelection,
} = useTableUI();

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
  openView,
  openEdit,
  close: handleCancel,
} = useCrudModal({
  initForm: () => ({
    noticeId: undefined as string | number | undefined,
    noticeTitle: "",
    noticeContent: "",
    noticeType: "2",
    statusFlag: "1",
    delFlag: "0",
    remark: "",
    createBy: undefined,
    createTime: undefined,
    updateBy: undefined,
    updateTime: undefined,
  }),
  rules: {
    noticeTitle: [
      { required: true, min: 2, max: 50, message: "请输入公告标题" },
    ],
    noticeType: [{ required: true, message: "请选择公告类型" }],
    noticeContent: [
      {
        required: true,
        min: 2,
        max: 3000,
        message: "请输入公告内容，长度2-3000个字符",
      },
    ],
  },
});

const tableColumns: ColumnsType = [
  { title: "公告编号", dataIndex: "noticeId", align: "left", width: 100 },
  { title: "公告标题", dataIndex: "noticeTitle", align: "left", width: 300 },
  {
    title: "公告类型",
    dataIndex: "noticeType",
    key: "noticeType",
    align: "left",
    width: 100,
  },
  {
    title: "状态",
    dataIndex: "statusFlag",
    key: "statusFlag",
    align: "left",
    width: 100,
  },
  { title: "创建者", dataIndex: "createBy", align: "left", width: 100 },
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
  { title: "操作", key: "noticeId", align: "left" },
];

/** 打开公告详情弹窗，根据公告编号查询并展示数据 */
function handleView(noticeId: string | number) {
  openView(noticeId, getNotice, "公告信息");
}

/** 打开新增或编辑弹窗，有 noticeId 则回填数据，否则为新增 */
function handleEdit(noticeId?: string | number) {
  openEdit(noticeId, getNotice, "添加公告", "修改公告");
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
      (form.noticeId ? updateNotice : addNotice)(form),
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

/** 删除公告（单条或批量），支持从选中行键列表批量删除 */
function handleDelete(noticeId: string = "0") {
  if (noticeId === "0") {
    noticeId = tableState.selectedRowKeys.join(",");
  }
  confirmAndRun({
    content: `确认删除公告编号为【${noticeId}】的数据项?`,
    onOk: () => delNotice(noticeId),
    successText: "删除成功",
    onSuccess: () => fetchList(),
  });
}

/** 查询公告列表，支持指定页码；删除后自动修正空页 */
async function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  try {
    const res = await listNotice(toRaw(queryParams));
    if (res.code === RESULT_CODE_SUCCESS) {
      clearSelection();
      setTotal(res.data.total);
      tableState.data = res.data.rows;
      if (fixPageAfterDelete(res.data.rows.length)) {
        queryParams.pageNum = pagination.current;
        const res2 = await listNotice(toRaw(queryParams));
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
        发布公告给内部用户的通知。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告标题" name="noticeTitle">
              <a-input v-model:value="queryParams.noticeTitle" allow-clear placeholder="请输入公告标题"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="创建者" name="createBy">
              <a-input v-model:value="queryParams.createBy" allow-clear placeholder="请输入创建者"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告类型" name="noticeType">
              <a-select v-model:value="queryParams.noticeType" allow-clear placeholder="请选择公告类型"
                :options="dict.sysNoticeType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择公告状态"
                :options="dict.sysNoticeStatus">
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
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:notice:add']">
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:notice:remove']">
            <template #icon><DeleteOutlined /></template>
            删除
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

      <a-table class="table" row-key="noticeId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName"
        :pagination="pagination" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'noticeType'">
            <DictTag :options="dict.sysNoticeType" :value="record.noticeType" />
          </template>
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysNoticeStatus" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'noticeId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.noticeId)"
                  v-perms:has="['system:notice:query']">
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleEdit(record.noticeId)"
                  v-perms:has="['system:notice:edit']">
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.noticeId)"
                  v-perms:has="['system:notice:remove']">
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
            <a-form-item label="公告类型" name="noticeType">
              <DictTag :options="dict.sysNoticeType" :value="modalState.form.noticeType" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告状态" name="statusFlag">
              <DictTag :options="dict.sysNoticeStatus" :value="modalState.form.statusFlag" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="公告标题" name="noticeTitle" :label-col="{ span: 3 }" :label-wrap="true">
          {{ modalState.form.noticeTitle }}
        </a-form-item>
        <a-form-item label="公告内容" name="noticeContent" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.noticeContent" :auto-size="{ minRows: 2, maxRows: 12 }"
            placeholder="公告内容" :disabled="true" />
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
            <a-form-item label="公告类型" name="noticeType" v-bind="modalStateForm.validateInfos.noticeType">
              <a-select v-model:value="modalState.form.noticeType" default-value="1" placeholder="公告类型"
                :options="dict.sysNoticeType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告状态" name="statusFlag">
              <a-select v-model:value="modalState.form.statusFlag" default-value="0" placeholder="公告状态"
                :options="dict.sysNoticeStatus">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="公告标题" name="noticeTitle" v-bind="modalStateForm.validateInfos.noticeTitle"
          :label-col="{ span: 3 }" :label-wrap="true">
          <a-input v-model:value="modalState.form.noticeTitle" allow-clear placeholder="请输入公告标题"
            :maxlength="50"></a-input>
        </a-form-item>
        <a-form-item label="公告内容" name="noticeContent" v-bind="modalStateForm.validateInfos.noticeContent"
          :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.noticeContent" :auto-size="{ minRows: 4, maxRows: 14 }"
            :maxlength="3000" :show-count="true" placeholder="请输入公告内容" />
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


