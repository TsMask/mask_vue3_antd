<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import type { DataNode } from 'ant-design-vue/es/tree';
import { dataScope, getRole } from '@/api/system/role';
import { deptTreeRole } from '@/api/system/dept';
import {
  parseTreeKeys,
  parseTreeNodeKeys,
  parseTreeNodeKeysByChecked,
} from '@/utils/parse-tree-utils';
import { parseDateToStr } from '@/utils/date-utils';
import { isSuccess, type ResultType } from '@/plugins/http-fetch';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysDataScope: [
      { label: '全部数据权限', value: '1' },
      { label: '自定数据权限', value: '2' },
      { label: '本部门数据权限', value: '3' },
      { label: '本部门及以下数据权限', value: '4' },
      { label: '仅本人数据权限', value: '5' },
    ],
  },
});

type TreeDataType = {
  treeData: DataNode[];
  checkedKeys: (string | number)[];
  expandedKeys: (string | number)[];
};

const { modal, openModal, closeModal } = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined,
    role_name: '',
    role_key: '',
    role_sort: 0,
    role_status: '0',
    dept_ids: [] as (string | number)[],
    remark: '',
    role_data_scope: '5',
    role_dept_check_strictly: '1',
    create_time: 0,
  }),
});

const form = modal.form;
/** 部门树展示状态；checkedKeys 是接口返回的实选节点。 */
const deptTreeCache: TreeDataType = {
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};
const deptTreeState = reactive<TreeDataType>({
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
});

interface RoleDataScopeDetail {
  role: Record<string, any>;
  dept?: { depts: any[]; checked_keys?: (string | number)[] };
}

/** 并行获取角色详情和部门树勾选状态，供弹窗一次回填 */
async function fetchRoleDataScopeDetail(
  role_id: string | number
): Promise<ResultType> {
  const [roleRes, deptRes] = await Promise.all([
    getRole(role_id),
    deptTreeRole(role_id),
  ]);
  if (!isSuccess(roleRes)) return roleRes;

  return {
    ...roleRes,
    data: {
      role: roleRes.data,
      dept: isSuccess(deptRes) && deptRes.data ? deptRes.data : undefined,
    },
  };
}

/**
 * 同步部门树展示状态与提交字段。
 * 父子联动时提交半选节点，保证自定义权限范围不丢失上级部门。
 */
function applyDeptTree(
  targetForm: Record<string, any>,
  depts: any[],
  checkedKeys: (string | number)[] = []
) {
  deptTreeCache.checkedKeys = parseTreeKeys(depts, 'id');
  deptTreeCache.expandedKeys = parseTreeNodeKeys(depts, 'id');
  deptTreeCache.treeData = depts;
  deptTreeState.treeData = depts;
  deptTreeState.checkedKeys = checkedKeys;

  if (targetForm.role_dept_check_strictly === '1') {
    const ids = parseTreeNodeKeysByChecked(depts, checkedKeys, 'id');
    targetForm.dept_ids = ids.concat(checkedKeys);
  } else {
    targetForm.dept_ids = checkedKeys;
  }
}

/** 打开数据权限弹窗并加载角色当前授权范围 */
function open(role_id: string | number) {
  if (!role_id) return;

  openModal<RoleDataScopeDetail>({
    mode: 'edit',
    title: '分配数据权限',
    fetchDetail: () => fetchRoleDataScopeDetail(role_id),
    transformDetail: data => data.role,
    beforeOpen(targetForm, data) {
      if (data?.dept) {
        applyDeptTree(
          targetForm,
          data.dept.depts,
          data.dept.checked_keys ?? []
        );
      }
    },
  });
}

const { executeAction, loading: submitting } = useModalAction();

/** 仅自定义范围需要部门勾选，其他范围提交前清空勾选避免脏数据 */
async function handleSubmit() {
  const formRaw = toRaw(form);
  if (formRaw.role_data_scope !== '2') formRaw.dept_ids = [];

  await executeAction({
    action: () => dataScope({ ...formRaw, role_id: formRaw.id }),
    successText: '操作成功',
    onSuccess: handleClose,
  });
}

/** 父子联动开启时，提交值需补充树组件返回的半选父节点 */
function handleTreeCheck(keys: any, info: any) {
  let ids = Array.isArray(keys) ? keys : keys.checked;
  if (form.role_dept_check_strictly === '1') {
    ids = ids.concat(info.halfCheckedKeys);
  }
  form.dept_ids = ids;
}

/** 展开/折叠使用缓存中的完整父节点集合，不依赖当前渲染状态 */
function handleTreeExpand(checked: boolean) {
  deptTreeState.expandedKeys = checked ? deptTreeCache.expandedKeys : [];
}

/** 全选使用完整树节点集合，而不是当前可视区域的勾选值 */
function handleTreeCheckAll(checked: boolean) {
  deptTreeState.checkedKeys = checked ? deptTreeCache.checkedKeys : [];
  form.dept_ids = deptTreeState.checkedKeys;
}

/** 切换父子联动模式，提交时决定是否补充半选节点 */
function handleTreeCheckStrictly(checked: boolean) {
  form.role_dept_check_strictly = checked ? '1' : '0';
}

/** 关闭时清空部门树状态，避免下次打开闪现上个角色的勾选 */
function handleClose() {
  closeModal();
  deptTreeState.treeData = [];
  deptTreeState.checkedKeys = [];
  deptTreeState.expandedKeys = [];
}

defineExpose({ open });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnClose="true"
    :width="800"
    :keyboard="false"
    :mask-closable="false"
    :open="modal.visible"
    title="分配数据权限"
    :confirm-loading="submitting"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form name="formCtlByRoleDataScope" layout="horizontal">
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色编号" name="id">
            {{ form.id }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="创建时间" name="create_time">
            <span v-if="+form.create_time > 0">
              {{ parseDateToStr(+form.create_time) }}
            </span>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色顺序" name="role_sort">
            {{ form.role_sort }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色状态" name="role_status">
            <DictTag
              :options="dict.sysNormalDisable"
              :value="form.role_status"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色名称" name="role_name">
            {{ form.role_name }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色键值" name="role_key">
            {{ form.role_key }}
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="角色说明" name="remark">
        <a-textarea
          :value="form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :disabled="true"
          style="color: rgba(0, 0, 0, 0.85)"
        />
      </a-form-item>
      <a-form-item label="权限范围" name="role_data_scope">
        <a-select
          v-model:value="form.role_data_scope"
          default-value="5"
          placeholder="权限范围"
          :options="dict.sysDataScope"
        />
      </a-form-item>
      <a-form-item
        label="数据权限"
        name="role_dept_check_strictly"
        v-show="form.role_data_scope === '2'"
      >
        <a-space :size="12" align="center">
          <a-checkbox
            :checked="deptTreeState.expandedKeys.length > 0"
            @change="(e: any) => handleTreeExpand(e.target.checked)"
          >
            展开/折叠
          </a-checkbox>
          <a-checkbox
            :checked="form.dept_ids.length > 0"
            @change="(e: any) => handleTreeCheckAll(e.target.checked)"
          >
            全选/全不选
          </a-checkbox>
          <a-checkbox
            :checked="form.role_dept_check_strictly === '1'"
            @change="(e: any) => handleTreeCheckStrictly(e.target.checked)"
          >
            父子联动
          </a-checkbox>
        </a-space>
        <a-tree
          checkable
          :selectable="false"
          @check="(checked: any, info: any) => handleTreeCheck(checked, info)"
          v-model:expanded-keys="deptTreeState.expandedKeys"
          v-model:checked-keys="deptTreeState.checkedKeys"
          :check-strictly="form.role_dept_check_strictly === '0'"
          :tree-data="deptTreeState.treeData"
          :field-names="{ children: 'children', title: 'label', key: 'id' }"
          :height="256"
          style="border: 1px solid #d9d9d9; border-radius: 6px; margin-top: 4px"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
