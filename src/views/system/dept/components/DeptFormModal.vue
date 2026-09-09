<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import {
  addDept,
  getDept,
  listDeptExcludeChild,
  updateDept,
} from '@/api/system/dept';
import { regExpMobile, regExpEmail } from '@/utils/regular-utils';
import { parseDataToTree } from '@/utils/parse-tree-utils';
import { isSuccess, type ResultType } from '@/plugins/http-fetch';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const props = defineProps<{
  deptTreeData: Record<string, any>[];
}>();
const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
  },
});

/** parent_id 是树选择字段，默认指向系统根部门。 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    dept_name: '',
    dept_email: '',
    dept_leader: '',
    dept_sort: 0,
    parent_id: 100 as string | number,
    dept_phone: '',
    dept_status: '0',
  };
}

const { modal, formCtl, isView, openModal, closeModal } = useModalForm({
  initForm: createDefaultForm,
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

const parentTreeData = reactive<Record<string, any>[]>([]);

/** 原地替换上级部门树，保证 TreeSelect 仍持有同一个响应式数组 */
function replaceParentTree(data: Record<string, any>[]) {
  parentTreeData.splice(0, parentTreeData.length, ...data);
}

interface DeptModalDetail {
  dept: Record<string, any>;
  departments?: Record<string, any>[];
}

/**
 * 详情与可选上级部门树一次取回，让 openModal 只负责打开编排。
 * 查看模式可用页面树兜底；编辑模式不兜底，避免把当前部门的子级选为上级。
 */
async function fetchDeptDetail(
  id: string | number,
  fallbackToPageTree: boolean
): Promise<ResultType> {
  const [deptRes, excludeRes] = await Promise.all([
    getDept(id),
    listDeptExcludeChild(id),
  ]);
  if (!isSuccess(deptRes)) return deptRes;

  const excludeDepts =
    isSuccess(excludeRes) && Array.isArray(excludeRes.data)
      ? excludeRes.data
      : fallbackToPageTree
        ? props.deptTreeData
        : undefined;
  const parentId = deptRes.data?.parent_id;
  const departments =
    Number(parentId) === 0
      ? [{ id: 0, parent_id: 0, dept_name: '根节点' }]
      : excludeDepts === undefined
        ? []
        : excludeDepts.length === 0 && !fallbackToPageTree
          ? [{ id: 0, parent_id: 0, dept_name: '根节点' }]
          : parseDataToTree(excludeDepts, 'id');

  return {
    ...deptRes,
    data: { dept: deptRes.data, departments },
  };
}

const { executeAction, loading: submitting } = useModalAction();

/** 统一处理查看/编辑的详情加载、表单回填和上级部门树替换 */
function openDetail(mode: 'view' | 'edit', id: string | number) {
  openModal<DeptModalDetail>({
    mode,
    title: mode === 'view' ? '部门信息' : '修改部门信息',
    fetchDetail: () => fetchDeptDetail(id, mode === 'view'),
    transformDetail: data => data.dept,
    beforeOpen(_form, data) {
      replaceParentTree(data?.departments ?? []);
    },
  });
}

function openView(id: string | number) {
  if (!id) return;
  openDetail('view', id);
}

/** 有 id 打开编辑；无 id 时可携带父部门 ID 直接新建子部门 */
function openEdit(id?: string | number, parentDeptId?: string | number) {
  if (!id) {
    openModal({
      mode: 'add',
      title: '添加部门信息',
      beforeOpen(form) {
        if (parentDeptId) form.parent_id = parentDeptId;
        replaceParentTree(props.deptTreeData);
      },
    });
    return;
  }

  openDetail('edit', id);
}

async function handleSubmit() {
  try {
    await formCtl.validate();
  } catch (error: any) {
    message.error({
      content: `请正确填写 ${error.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }

  const form = toRaw(modal.form);
  await executeAction({
    action: () => (form.id ? updateDept(form) : addDept(form)),
    successText: '操作成功',
    onSuccess: () => {
      handleClose();
      emit('success');
    },
  });
}

/** 关闭弹窗时同步清理上级部门树，避免下次打开闪现旧数据 */
function handleClose() {
  closeModal();
  replaceParentTree([]);
}

defineExpose({ openView, openEdit });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnClose="true"
    :width="800"
    :keyboard="!isView"
    :mask-closable="isView"
    :open="modal.visible"
    :title="modal.title"
    :confirm-loading="submitting"
    :footer="isView ? null : undefined"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form
      name="formCtlByDeptEdit"
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
        {{ modal.form.id }}
      </a-form-item>
      <a-form-item
        label="上级部门"
        name="parent_id"
        v-bind="formCtl.validateInfos.parent_id"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-tree-select
          v-model:value="modal.form.parent_id"
          placeholder="上级部门"
          show-search
          tree-default-expand-all
          :tree-data="parentTreeData"
          :field-names="{
            children: 'children',
            label: 'dept_name',
            value: 'id',
          }"
          tree-node-label-prop="dept_name"
          tree-node-filter-prop="dept_name"
          style="width: 100%"
          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
        />
      </a-form-item>
      <a-form-item
        label="部门名称"
        name="dept_name"
        v-bind="formCtl.validateInfos.dept_name"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-input
          v-model:value="modal.form.dept_name"
          allow-clear
          :maxlength="50"
          placeholder="请输入部门名称"
        />
      </a-form-item>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="部门状态" name="dept_status">
            <a-select
              v-model:value="modal.form.dept_status"
              default-value="0"
              placeholder="部门状态"
              :options="dict.sysNormalDisable"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="显示顺序" name="dept_sort">
            <a-input-number
              v-model:value="modal.form.dept_sort"
              :min="0"
              :max="9999"
              :step="1"
              placeholder="排序值"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="负责人" name="dept_leader">
            <a-input
              v-model:value="modal.form.dept_leader"
              allow-clear
              placeholder="请输入负责人名称"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="联系电话"
            name="dept_phone"
            v-bind="formCtl.validateInfos.dept_phone"
          >
            <a-input
              v-model:value="modal.form.dept_phone"
              allow-clear
              :maxlength="11"
              placeholder="请输入负责人联系电话"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="邮箱"
            name="dept_email"
            v-bind="formCtl.validateInfos.dept_email"
          >
            <a-input
              v-model:value="modal.form.dept_email"
              allow-clear
              :maxlength="40"
              placeholder="请输入负责人邮箱"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </ProModal>
</template>
