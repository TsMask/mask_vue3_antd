<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw, onMounted } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import type { ColumnsType } from "ant-design-vue/es/table";
import {
  exportPost,
  listPost,
  addPost,
  delPost,
  getPost,
  updatePost,
} from "@/api/system/post";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { RESULT_CODE_SUCCESS } from "@/constants/result-constants";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useMessageAction } from "@/hooks/useMessageAction";
import { useDictSetup } from "@/hooks/useDictSetup";

const route = useRoute();

/**路由标题 */
const title = ref<string>(route.meta.title ?? "标题");

/**字典数据 */
const { dict, loadDicts } = useDictSetup({
  sysNormalDisable: "sys_normal_disable",
});

/**操作反馈 */
const { withLoading, confirmAndRun } = useMessageAction();

/**查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    postCode: "",
    postName: "",
    statusFlag: undefined as string | undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/**表格UI */
const {
  tableState,
  setTableSize,
  rowClassName,
  setSelectedRowKeys,
  clearSelection,
} = useTableUI();

/**分页 */
const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

/**弹窗 */
const {
  modal: modalState,
  formCtl: modalStateForm,
  openView,
  openEdit,
  close: handleCancel,
} = useCrudModal({
  initForm: () => ({
    postId: undefined as string | number | undefined,
    postName: "",
    postCode: "",
    postSort: 0,
    statusFlag: "0",
    remark: "",
    createTime: 0,
  }),
  rules: {
    postName: [
      { required: true, min: 1, max: 50, message: "请输入岗位编码" },
    ],
    postCode: [
      { required: true, min: 1, max: 50, message: "请输入岗位名称" },
    ],
  },
});

/**表格字段列 */
const tableColumns: ColumnsType = [
  {
    title: "岗位编号",
    dataIndex: "postId",
    align: "left",
    width: 100,
  },
  {
    title: "岗位编码",
    dataIndex: "postCode",
    align: "left",
    width: 100,
  },
  {
    title: "岗位名称",
    dataIndex: "postName",
    align: "left",
    width: 200,
  },
  {
    title: "岗位排序",
    dataIndex: "postSort",
    align: "left",
    width: 100,
  },
  {
    title: "岗位状态",
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
  {
    title: "操作",
    key: "postId",
    align: "left",
  },
];

/** 打开岗位详情弹窗，根据岗位编号查询并展示数据 */
function handleView(postId: string | number) {
  openView(postId, getPost, "岗位信息");
}

/** 打开新增或编辑弹窗，有 postId 则回填数据，否则为新增 */
function handleEdit(postId?: string | number) {
  openEdit(postId, getPost, "添加岗位信息", "修改岗位信息");
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
      (form.postId ? updatePost : addPost)(form),
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

/** 删除岗位（单条或批量），支持从选中行键列表批量删除 */
function handleDelete(postId: string = "0") {
  if (postId === "0") {
    postId = tableState.selectedRowKeys.join(",");
  }
  confirmAndRun({
    content: `确认删除岗位编号为【${postId}】的数据项?`,
    onOk: () => delPost(postId),
    successText: "删除成功",
    onSuccess: () => fetchList(),
  });
}

/** 根据当前搜索条件导出岗位列表 xlsx 文件 */
function handleExport() {
  confirmAndRun({
    content: "确认根据搜索条件导出xlsx表格文件吗",
    onOk: () => exportPost(toRaw(queryParams)),
    successText: "已导出完成",
    onSuccess: (res) => {
      saveAs(res.data, `post_${Date.now()}.xlsx`);
    },
  });
}

/** 查询岗位列表，支持指定页码；删除后自动修正空页 */
async function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  try {
    const res = await listPost(toRaw(queryParams));
    if (res.code === RESULT_CODE_SUCCESS) {
      clearSelection();
      setTotal(res.data.total);
      tableState.data = res.data.rows;
      if (fixPageAfterDelete(res.data.rows.length)) {
        queryParams.pageNum = pagination.current;
        const res2 = await listPost(toRaw(queryParams));
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
      <a-typography-paragraph> 给予用户岗位标记 </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位编码" name="postCode">
              <a-input
                v-model:value="queryParams.postCode"
                allow-clear
                placeholder="请输入岗位编码"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位名称" name="postName">
              <a-input
                v-model:value="queryParams.postName"
                allow-clear
                placeholder="请输入岗位名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
                allow-clear
                placeholder="请选择"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fetchList(1)">
                  <template #icon><SearchOutlined /></template>
                  搜索</a-button
                >
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon><ClearOutlined /></template>
                  重置</a-button
                >
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <!-- 插槽-卡片左侧 -->
      <template #title>
        <a-space :size="8" align="center">
          <a-button
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['system:post:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()"
            v-perms:has="['system:post:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:post:export']"
          >
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="是"
              un-checked-children="否"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch
              v-model:checked="tableState.striped"
              checked-children="开"
              un-checked-children="关"
              size="small"
            />
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
                <a-menu
                  :selected-keys="[tableState.size as string]"
                  @click="setTableSize"
                >
                  <a-menu-item key="default">默认</a-menu-item>
                  <a-menu-item key="middle">中等</a-menu-item>
                  <a-menu-item key="small">紧凑</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>

      <!-- 表格列表 -->
      <a-table
        class="table"
        row-key="postId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="rowClassName"
        :pagination="pagination"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag
              :options="dict.sysNormalDisable"
              :value="record.statusFlag"
            />
          </template>
          <template v-if="column.key === 'postId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="handleView(record.postId)"
                  v-perms:has="['system:post:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="handleEdit(record.postId)"
                  v-perms:has="['system:post:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="handleDelete(record.postId)"
                  v-perms:has="['system:post:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal
      :drag="true"
      :width="800"
      :open="modalState.visibleByView"
      :title="modalState.title"
      @cancel="handleCancel"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位编号" name="postId">
              {{ modalState.form.postId }}
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
            <a-form-item label="岗位顺序" name="postSort">
              {{ modalState.form.postSort }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位编码" name="postCode">
              {{ modalState.form.postCode }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位名称" name="postName">
              {{ modalState.form.postName }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="岗位说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="false"
      :mask-closable="false"
      :open="modalState.visibleByEdit"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        name="modalStateForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="岗位编码"
              name="postCode"
              v-bind="modalStateForm.validateInfos.postCode"
            >
              <a-input
                v-model:value="modalState.form.postCode"
                allow-clear
                placeholder="请输入岗位编码"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="岗位状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="岗位名称"
              name="postName"
              v-bind="modalStateForm.validateInfos.postName"
            >
              <a-input
                v-model:value="modalState.form.postName"
                allow-clear
                placeholder="请输入岗位名称"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位顺序" name="postSort">
              <a-input-number
                v-model:value="modalState.form.postSort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="排序值"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="岗位说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="200"
            :show-count="true"
            placeholder="请输入岗位说明"
          />
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

