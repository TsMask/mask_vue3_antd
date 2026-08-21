<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, computed, watch } from "vue";
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
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useListQuery } from "@/hooks/useListQuery";
import { useAction, confirmAction } from "@/hooks/useAction";

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

/** 查询参数 */
const { queryParams, handleQuery, resetQuery } = useQueryParams(
  {
    notice_title: "",
    create_by: undefined as string | undefined,
    notice_type: undefined as string | undefined,
    notice_status: undefined as string | undefined,
    page_num: 1,
    page_size: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/** 分页管理 */
const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, page_size) => {
    queryParams.page_num = page;
    queryParams.page_size = page_size;
    fetchList()
  },
});

/** 列表数据查询 */
const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => listNotice(toRaw(queryParams)),
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
    fetchList();
  },
});

/** 表格字段列 */
const tableColumns: ColumnsType = [
  { title: "公告编号", dataIndex: "id", align: "left", width: 100 },
  { title: "公告标题", dataIndex: "notice_title", align: "left", width: 300 },
  {
    title: "公告类型",
    dataIndex: "notice_type",
    key: "notice_type",
    align: "left",
    width: 100,
  },
  {
    title: "状态",
    dataIndex: "notice_status",
    key: "notice_status",
    align: "left",
    width: 100,
  },
  { title: "创建者", dataIndex: "create_by", align: "left", width: 100 },
  {
    title: "创建时间",
    dataIndex: "create_time",
    align: "left",
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return "";
      return parseDateToStr(+opt.value);
    },
  },
  { title: "操作", key: "id", align: "left" },
];

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
    id = tableState.selectedRowKeys.join(",");
  }
  confirmAction({
    content: `确认删除公告编号为【${id}】的数据项?`,
    action: (id) => delNotice(id),
    variables: id,
    successText: "删除成功",
    onSuccess() {
      const deletedCount = String(id).split(",").length;
      if (!clampPage(deletedCount)) fetchList();
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

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告标题" name="notice_title">
              <a-input v-model:value="queryParams.notice_title" allow-clear placeholder="请输入公告标题"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="创建者" name="create_by">
              <a-input v-model:value="queryParams.create_by" allow-clear placeholder="请输入创建者"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告类型" name="notice_type">
              <a-select v-model:value="queryParams.notice_type" allow-clear placeholder="请选择公告类型"
                :options="dict.sysNoticeType">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告状态" name="notice_status">
              <a-select v-model:value="queryParams.notice_status" allow-clear placeholder="请选择公告状态"
                :options="dict.sysNoticeStatus">
              </a-select>
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
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:notice:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:notice:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
        </a-space>
      </template>

      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.searched" checked-children="显" un-checked-children="隐" size="small" />
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
        :size="tableState.size" :row-class-name="rowClassName" :pagination="pagination" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'notice_type'">
            <DictTag :options="dict.sysNoticeType" :value="record.notice_type" />
          </template>
          <template v-if="column.key === 'notice_status'">
            <DictTag :options="dict.sysNoticeStatus" :value="record.notice_status" />
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.id)"
                  v-perms:has="['system:notice:query']">
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
                <a-button type="link" @click.prevent="handleDelete(record.id)"
                  v-perms:has="['system:notice:remove']">
                  <template #icon>
                    <DeleteOutlined />
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
            <a-form-item label="公告类型" name="notice_type">
              <DictTag :options="dict.sysNoticeType" :value="modalState.form.notice_type" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告状态" name="notice_status">
              <DictTag :options="dict.sysNoticeStatus" :value="modalState.form.notice_status" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="公告标题" name="notice_title" :label-col="{ span: 3 }" :label-wrap="true">
          {{ modalState.form.notice_title }}
        </a-form-item>
        <a-form-item label="公告内容" name="notice_content" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.notice_content" :auto-size="{ minRows: 2, maxRows: 12 }"
            placeholder="公告内容" :disabled="true" />
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
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
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
            :maxlength="3000" :show-count="true" placeholder="请输入公告内容" />
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