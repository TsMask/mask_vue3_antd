<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, reactive, computed, toRaw, watch } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import {
  listDept,
  getDept,
  delDept,
  addDept,
  updateDept,
  listDeptExcludeChild,
} from '@/api/system/dept';
import { parseDateToStr } from '@/utils/date-utils';
import { regExpMobile, regExpEmail } from '@/utils/regular-utils';
import { parseDataToTree } from '@/utils/parse-tree-utils';
import { isSuccess, type ResultType } from '@/plugins/http-fetch';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

/** 列表数据查询 */
const { dataSource, loading, onSearch, onReset, onTableChange, reload } =
  useProTable({
    queryFn: listDept,
    defaultPageSize: 20,
  });

/** 树表格额外状态：展开行、全部展开标记 */
const expandedRowAll = ref(true);
const expandedRowKeys: (string | number)[] = reactive([]);

/** 全部展开时的key列表 */
let globalExpandedKeys: (string | number)[] = [];

/** 解析为树结构（响应式，dataSource 变化自动重算） */
const treeData = computed(() => parseDataToTree(dataSource.value, 'id'));

/** 弹窗表单中的上级部门树 */
const treeDataForModal = computed(() => treeData.value);

/** 首次加载后初始化展开状态 */
watch(
  dataSource,
  newData => {
    if (newData.length > 0 && globalExpandedKeys.length === 0) {
      globalExpandedKeys = [
        ...new Set(newData.map((item: any) => item.parent_id)),
      ];
      expandedRowKeys.length = 0;
      expandedRowKeys.push(...globalExpandedKeys);
      handleToggleExpandAll(expandedRowAll.value);
    }
  },
  { once: true }
);

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '部门名称', dataIndex: 'dept_name', align: 'left', width: 200 },
  { title: '部门编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '部门排序', dataIndex: 'dept_sort', align: 'left', width: 100 },
  {
    title: '部门状态',
    dataIndex: 'dept_status',
    key: 'dept_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 150,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '部门名称', dataIndex: 'dept_name' },
  {
    title: '部门状态',
    dataIndex: 'dept_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

/** 表格展开/折叠控制 */
function handleToggleExpandAll(checked: boolean | string | number) {
  if (checked) {
    expandedRowKeys.length = 0;
    expandedRowKeys.push(...globalExpandedKeys);
  } else {
    expandedRowKeys.length = 0;
  }
}

/** 表格展开行变化回调 */
function handleExpandedRowsChange(expandedRows: (string | number)[]) {
  expandedRowKeys.length = 0;
  expandedRowKeys.push(...expandedRows);
}

// ==================== 弹窗状态 ====================

const modalTreeData = reactive<Record<string, any>[]>([]);

/** 表单弹窗管理（单弹窗 + 模式驱动） */
const {
  modal: modalState,
  formCtl: modalStateForm,
  isView,
  openModal,
  closeModal: handleCloseModal,
} = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined,
    dept_name: '',
    dept_email: '',
    dept_leader: '',
    dept_sort: 0,
    parent_id: 100 as string | number,
    dept_phone: '',
    dept_status: '0',
  }),
  rules: {
    parent_id: [{ required: true, message: '上级部门不能为空' }],
    dept_name: [
      { required: true, min: 1, max: 50, message: '请正确输入部门名称' },
    ],
    dept_email: [
      {
        required: false,
        pattern: regExpEmail,
        message: '请输入正确的邮箱地址',
      },
    ],
    dept_phone: [
      {
        required: false,
        pattern: regExpMobile,
        message: '请输入正确的手机号码',
      },
    ],
  },
});

/** 替换弹窗上级部门树数据 */
function setModalTreeData(data: Record<string, any>[]) {
  modalTreeData.splice(0, modalTreeData.length, ...data);
}

interface DeptModalDetail {
  dept: Record<string, any>;
  departments?: Record<string, any>[];
}

/** 详情与可选上级部门树一次取回，让 openModal 只负责打开编排 */
async function fetchDeptModal(
  id: string | number,
  useListTreeWhenExcludeFailed: boolean
): Promise<ResultType> {
  const [deptRes, excludeRes] = await Promise.all([
    getDept(id),
    listDeptExcludeChild(id),
  ]);
  if (!isSuccess(deptRes)) return deptRes;

  const excludeDepts =
    isSuccess(excludeRes) && Array.isArray(excludeRes.data)
      ? excludeRes.data
      : useListTreeWhenExcludeFailed
        ? treeDataForModal.value
        : undefined;
  const parentId = deptRes.data?.parent_id;
  const departments =
    Number(parentId) === 0
      ? [{ id: 0, parent_id: 0, dept_name: '根节点' }]
      : excludeDepts === undefined
        ? undefined
        : excludeDepts.length === 0 && !useListTreeWhenExcludeFailed
          ? [{ id: 0, parent_id: 0, dept_name: '根节点' }]
          : parseDataToTree(excludeDepts, 'id');

  return {
    ...deptRes,
    data: { dept: deptRes.data, departments },
  };
}

/** 新增/编辑操作 */
const {
  confirmAction,
  executeAction,
  loading: isSubmitting,
} = useModalAction();

/** 打开已有部门的详情/编辑弹窗 */
function openDeptDetailModal(mode: 'view' | 'edit', id: string | number) {
  openModal<DeptModalDetail>({
    mode,
    title: mode === 'view' ? '部门信息' : '修改部门信息',
    fetchDetail: () => fetchDeptModal(id, mode === 'view'),
    transformDetail: data => data.dept,
    beforeOpen: (_form, data) => {
      if (data?.departments) setModalTreeData(data.departments);
    },
  });
}

/** 打开新增/编辑弹窗 */
function handleOpenEdit(id?: string | number, parent_id?: string | number) {
  if (!id) {
    openModal({
      mode: 'add',
      title: '添加部门信息',
      beforeOpen(form) {
        if (parent_id) form.parent_id = parent_id;
        setModalTreeData(treeDataForModal.value);
      },
    });
  } else {
    openDeptDetailModal('edit', id);
  }
}

/** 打开详情弹窗 */
function handleView(id: string | number) {
  if (!id) return;
  openDeptDetailModal('view', id);
}

/** 表单提交确认 */
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
  await executeAction({
    action: () => (form.id ? updateDept(form) : addDept(form)),
    successText: '操作成功',
    onSuccess() {
      handleCloseModal();
      reload();
    },
  });
}

/** 删除部门 */
function handleDelete(id: string | number) {
  confirmAction({
    content: `确认删除部门编号为 【${id}】 的数据项?`,
    action: () => delDept(id),
    successText: '删除成功',
    onSuccess: () => reload(),
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户部门标记 </a-typography-paragraph>
    </template>

    <!-- 表格列表 -->
    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="treeData"
      :loading="loading"
      :pagination="false"
      @change="onTableChange"
      :scroll="tableScroll"
      :expanded-row-keys="expandedRowKeys"
      children-column-name="children"
      @expandedRowsChange="handleExpandedRowsChange"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: { columnsStateKey: 'system-dept', columnsStateType: 'local' },
        onReload: reload,
      }"
    >
      <template #toolBarRender>
        <a-space
          :size="8"
          align="center"
          :style="{ flexWrap: 'wrap', marginBottom: '8px' }"
        >
          <a-button
            type="primary"
            @click.prevent="handleOpenEdit()"
            v-perms:has="['system:dept:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
        </a-space>
      </template>
      <template #toolbarRight>
        <a-tooltip placement="topRight">
          <template #title>展开/折叠</template>
          <a-switch
            v-model:checked="expandedRowAll"
            checked-children="展"
            un-checked-children="折"
            size="small"
            @change="handleToggleExpandAll"
          />
        </a-tooltip>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dept_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.dept_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:dept:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleOpenEdit(record.id)"
                v-perms:has="['system:dept:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight" v-if="record.parent_id !== 0">
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:dept:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight" v-if="record.dept_status !== '0'">
              <template #title>新增子部门</template>
              <a-button
                type="link"
                @click.prevent="handleOpenEdit(undefined, record.id)"
                v-perms:has="['system:dept:add']"
              >
                <template #icon>
                  <PlusOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <!-- 详情框或新增修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="!isView"
      :mask-closable="isView"
      :open="modalState.visible"
      :title="modalState.title"
      :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined"
      @ok="handleSubmit"
      @cancel="handleCloseModal"
    >
      <a-form
        name="modalForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
        :disabled="isView"
      >
        <a-form-item
          v-if="isView"
          label="部门编号"
          name="id"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          {{ modalState.form.id }}
        </a-form-item>
        <a-form-item
          label="上级部门"
          name="parent_id"
          v-bind="modalStateForm.validateInfos.parent_id"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            v-model:value="modalState.form.parent_id"
            placeholder="上级部门"
            show-search
            tree-default-expand-all
            :tree-data="modalTreeData"
            :field-names="{
              children: 'children',
              label: 'dept_name',
              value: 'id',
            }"
            tree-node-label-prop="dept_name"
            tree-node-filter-prop="dept_name"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          >
          </a-tree-select>
        </a-form-item>
        <a-form-item
          label="部门名称"
          name="dept_name"
          v-bind="modalStateForm.validateInfos.dept_name"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-input
            v-model:value="modalState.form.dept_name"
            allow-clear
            :maxlength="50"
            placeholder="请输入部门名称"
          ></a-input>
        </a-form-item>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="部门状态" name="dept_status">
              <a-select
                v-model:value="modalState.form.dept_status"
                default-value="0"
                placeholder="部门状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示顺序" name="dept_sort">
              <a-input-number
                v-model:value="modalState.form.dept_sort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="排序值"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="负责人"
              name="dept_leader"
              v-bind="modalStateForm.validateInfos.dept_leader"
            >
              <a-input
                v-model:value="modalState.form.dept_leader"
                allow-clear
                placeholder="请输入负责人名称"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="联系电话"
              name="dept_phone"
              v-bind="modalStateForm.validateInfos.dept_phone"
            >
              <a-input
                v-model:value="modalState.form.dept_phone"
                allow-clear
                :maxlength="11"
                placeholder="请输入负责人联系电话"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="邮箱"
              name="dept_email"
              v-bind="modalStateForm.validateInfos.dept_email"
            >
              <a-input
                v-model:value="modalState.form.dept_email"
                allow-clear
                :maxlength="40"
                placeholder="请输入负责人邮箱"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
