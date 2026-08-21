<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, toRaw } from "vue";
import { PageContainer } from "antdv-pro-layout";
import { ProModal } from "antdv-pro-modal";
import { message } from "ant-design-vue";
import type { ColumnsType } from "ant-design-vue/es/table";
import { exportPost, listPost, addPost, delPost, getPost, updatePost } from "@/api/system/post";
import { saveAs } from "file-saver";
import { parseDateToStr } from "@/utils/date-utils";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePagination } from "@/hooks/usePagination";
import { useTableUI } from "@/hooks/useTableUI";
import { useCrudModal } from "@/hooks/useCrudModal";
import { useDictSetup } from "@/hooks/useDictSetup";
import { useListQuery } from "@/hooks/useListQuery";
import { useAction, confirmAction } from "@/hooks/useAction";

const route = useRoute();
const title = ref<string>(route.meta.title ?? "标题");

const { dict } = useDictSetup({ keyMap: { sysNormalDisable: "sys_normal_disable" } });

const { queryParams, handleQuery, resetQuery } = useQueryParams(
  { post_code: "", post_name: "", post_status: undefined as string | undefined, page_num: 1, page_size: 20 },
  () => { resetPage(); fetchList(); },
);

const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, page_size) => { queryParams.page_num = page; queryParams.page_size = page_size; fetchList(); },
});

const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => listPost(toRaw(queryParams)),
});

const { tableState, setTableSize, rowClassName, setSelectedRowKeys } = useTableUI();

const { modal: modalState, formCtl: modalStateForm, openView, openEdit, close: handleCancel } = useCrudModal({
  initForm: () => ({
    id: undefined as string | number | undefined, post_code: "", post_name: "", post_sort: 0, post_status: "0", remark: undefined as string | undefined, create_time: 0,
  }),
  rules: {
    post_code: [{ required: true, min: 1, max: 50, message: "请输入岗位编码" }],
    post_name: [{ required: true, min: 1, max: 50, message: "请输入岗位名称" }],
    post_sort: [{ required: true, message: "请输入岗位排序" }],
  },
});

const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form: Record<string, any>) => form.id ? updatePost(form) : addPost(form),
  successText: "操作成功",
  onSuccess() {
    handleCancel();
    fetchList();
  },
});

const tableColumns: ColumnsType = [
  { title: "岗位编号", dataIndex: "id", align: "left", width: 100 },
  { title: "岗位编码", dataIndex: "post_code", align: "left", width: 200 },
  { title: "岗位名称", dataIndex: "post_name", align: "left", width: 200 },
  { title: "岗位排序", dataIndex: "post_sort", align: "left", width: 100 },
  { title: "状态", dataIndex: "post_status", key: "post_status", align: "left", width: 100 },
  { title: "创建时间", dataIndex: "create_time", align: "left", width: 150, customRender(opt) { if (+opt.value <= 0) return ""; return parseDateToStr(+opt.value); } },
  { title: "操作", key: "id", align: "left" },
];

function handleView(id: string | number) { openView(id, getPost, "岗位信息"); }
function handleEdit(id?: string | number) { openEdit(id, getPost, "添加岗位", "修改岗位"); }

async function handleSubmit() {
  try {
    await modalStateForm.validate();
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  submitExecute(toRaw(modalState.form));
}

function handleDelete(id: string = "0") {
  if (id === "0") id = tableState.selectedRowKeys.join(",");
  confirmAction({
    content: `确认删除岗位编号为【${id}】的数据项?`,
    action: (id) => delPost(id), variables: id, successText: "删除成功",
    onSuccess() {
      const deletedCount = String(id).split(",").length;
      if (!clampPage(deletedCount)) fetchList();
    },
  });
}

function handleExport() {
  confirmAction({
    content: "确认根据搜索条件导出数据文件吗",
    action: () => exportPost(toRaw(queryParams)), variables: undefined as any, successText: "已导出完成",
    onSuccess: (res) => { saveAs(res.data, `post_${Date.now()}.csv`); },
  });
}
</script>
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户岗位标记 </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位编码" name="post_code">
              <a-input v-model:value="queryParams.post_code" allow-clear placeholder="请输入岗位编码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位名称" name="post_name">
              <a-input v-model:value="queryParams.post_name" allow-clear placeholder="请输入岗位名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="post_status">
              <a-select v-model:value="queryParams.post_status" allow-clear placeholder="请选择"
                :options="dict.sysNormalDisable">
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
                  搜索</a-button>
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  重置</a-button>
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
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:post:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:post:remove']">
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

      <!-- 插槽-卡片右侧 -->
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

      <!-- 表格列表 -->
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
          <template v-if="column.key === 'post_status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.post_status" />
          </template>
          <template v-if="column.key === 'id'">
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
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="modalState.visibleByView" :title="modalState.title"
      @cancel="handleCancel">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
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
            <a-form-item label="岗位顺序" name="post_sort">
              {{ modalState.form.post_sort }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="post_status">
              <DictTag :options="dict.sysNormalDisable" :value="modalState.form.post_status" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位编码" name="post_code">
              {{ modalState.form.post_code }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="岗位名称" name="post_name">
              {{ modalState.form.post_name }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="岗位说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
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
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
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
            :show-count="true" placeholder="请输入岗位说明" />
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
