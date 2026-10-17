<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'antdv-next';
import type { TreeDataNode } from 'antdv-next';
import { addRole, getRole, updateRole } from '@/api/system/role';
import { menuTreeSelect, menuTreeSelectRole } from '@/api/system/menu';
import {
  parseTreeKeys,
  parseTreeNodeKeys,
  parseTreeNodeKeysByChecked,
} from '@/utils/parseTree';
import { parseDateToStr } from '@/utils/date';
import { isSuccess, type ResultType } from '@/api/httpClient';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{ success: [] }>();
const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
  },
});

type TreeDataType = {
  treeData: TreeDataNode[];
  checkedKeys: (string | number)[];
  expandedKeys: (string | number)[];
};

const { modal, formCtl, rules, isView, openModal, closeModal } = useModalForm({
  formName: 'formCtlByRoleEdit',
  initForm: () => ({
    id: undefined as string | number | undefined,
    role_name: '',
    role_key: '',
    role_sort: 0,
    role_status: '0',
    menu_ids: [] as (string | number)[],
    dept_ids: [] as (string | number)[],
    remark: '',
    role_data_scope: '5',
    role_dept_check_strictly: '1',
    role_menu_check_strictly: '1',
    create_time: 0,
  }),
  rules: {
    role_name: [
      { required: true, min: 1, max: 30, message: '请正确输入角色名称' },
    ],
    role_key: [
      { required: true, min: 1, max: 50, message: '请正确输入角色键值' },
    ],
  },
});

const form = modal.form;
/** 菜单树接口数据缓存，新增弹窗复用，避免每次打开都请求全量菜单。 */
const menuTreeCache: TreeDataType = {
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};
const menuTreeState = reactive<TreeDataType>({
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
});

interface RoleModalDetail {
  role: Record<string, any>;
  menu?: { menus: any[]; checked_keys?: (string | number)[] };
}

/**
 * 同步菜单树展示状态与提交字段。
 * 父子联动模式下后端需要半选节点，因此把半选 key 一并合并进 menu_ids。
 */
function applyRoleMenuTree(
  targetForm: Record<string, any>,
  menus: any[],
  checkedKeys: (string | number)[] = []
) {
  menuTreeCache.checkedKeys = parseTreeKeys(menus, 'id');
  menuTreeCache.expandedKeys = parseTreeNodeKeys(menus, 'id');
  menuTreeCache.treeData = menus;
  menuTreeState.treeData = menus;
  menuTreeState.checkedKeys = checkedKeys;

  if (targetForm.role_menu_check_strictly === '1') {
    const ids = parseTreeNodeKeysByChecked(menus, checkedKeys, 'id');
    targetForm.menu_ids = ids.concat(checkedKeys);
  } else {
    targetForm.menu_ids = checkedKeys;
  }
}

/** 并行获取角色详情和该角色已勾选菜单，再合并成弹窗一次回填的数据 */
async function fetchRoleDetail(role_id: string | number): Promise<ResultType> {
  const [roleRes, menuRes] = await Promise.all([
    getRole(role_id),
    menuTreeSelectRole(role_id),
  ]);
  if (!isSuccess(roleRes)) return roleRes;

  return {
    ...roleRes,
    data: {
      role: roleRes.data,
      menu: isSuccess(menuRes) && menuRes.data ? menuRes.data : undefined,
    },
  };
}

/** 统一处理查看/编辑的角色详情加载与菜单树回填 */
function openDetail(mode: 'view' | 'edit', role_id: string | number) {
  openModal<RoleModalDetail>({
    mode,
    title: mode === 'view' ? '角色信息' : '修改角色信息',
    fetchDetail: () => fetchRoleDetail(role_id),
    transformDetail: data => data.role,
    beforeOpen(targetForm, data) {
      if (data?.menu) {
        applyRoleMenuTree(
          targetForm,
          data.menu.menus,
          data.menu.checked_keys ?? []
        );
      }
    },
  });
}

/** 新增优先复用已缓存菜单树；编辑则按角色重新拉取勾选状态 */
function openEdit(role_id?: string | number) {
  if (!role_id) {
    if (menuTreeCache.treeData.length > 0) {
      openModal({
        mode: 'add',
        title: '添加角色信息',
        beforeOpen() {
          menuTreeState.treeData = menuTreeCache.treeData;
        },
      });
    } else {
      openModal({
        mode: 'add',
        title: '添加角色信息',
        fetchDetail: menuTreeSelect,
        transformDetail: () => ({}),
        beforeOpen(targetForm, menus) {
          if (menus) applyRoleMenuTree(targetForm, menus);
        },
        errorMessage: '获取菜单信息失败',
      });
    }
    return;
  }

  openDetail('edit', role_id);
}

function openView(role_id: string | number) {
  if (!role_id) return;
  openDetail('view', role_id);
}

const { executeAction, loading: submitting } = useModalAction();

/** 校验基础字段后，把菜单勾选结果随角色表单一起提交 */
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

  const formRaw = toRaw(form);
  await executeAction({
    action: () => (formRaw.id ? updateRole(formRaw) : addRole(formRaw)),
    successText: '操作成功',
    onSuccess: () => {
      handleClose();
      emit('success');
    },
  });
}

/** 父子联动开启时，提交值需补充树组件返回的半选父节点 */
function handleTreeCheck(keys: any, info: any) {
  let ids = Array.isArray(keys) ? keys : keys.checked;
  if (form.role_menu_check_strictly === '1') {
    ids = ids.concat(info.halfCheckedKeys);
  }
  form.menu_ids = ids;
}

function handleTreeExpand(checked: boolean) {
  menuTreeState.expandedKeys = checked ? menuTreeCache.expandedKeys : [];
}

/** 全选使用完整树节点集合，而不是当前可视区域的勾选值 */
function handleTreeCheckAll(checked: boolean) {
  menuTreeState.checkedKeys = checked ? menuTreeCache.checkedKeys : [];
  form.menu_ids = menuTreeState.checkedKeys;
}

function handleTreeCheckStrictly(checked: boolean) {
  form.role_menu_check_strictly = checked ? '1' : '0';
}

/** 关闭时清空菜单树状态，避免下次打开闪现上个角色的勾选 */
function handleClose() {
  closeModal();
  menuTreeState.treeData = [];
  menuTreeState.checkedKeys = [];
  menuTreeState.expandedKeys = [];
}

defineExpose({ openView, openEdit });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnHidden="true"
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
      name="formCtlByRoleEdit"
      :model="modal.form"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-row v-if="isView">
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
          <a-form-item
            label="角色名称"
            name="role_name"
            v-bind="formCtl.validateInfos.role_name"
          >
            <a-input
              v-model:value="form.role_name"
              allow-clear
              placeholder="请输入角色名称"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色状态" name="role_status">
            <a-select
              v-model:value="form.role_status"
              default-value="0"
              placeholder="角色状态"
              :options="dict.sysNormalDisable"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="角色键值"
            name="role_key"
            v-bind="formCtl.validateInfos.role_key"
          >
            <a-input
              v-model:value="form.role_key"
              allow-clear
              placeholder="请输入角色键值"
              :maxlength="50"
            >
              <template #prefix>
                <a-tooltip
                  placement="topLeft"
                  :get-popup-container="trigger => trigger.parentElement!"
                >
                  <template #title>
                    <div>
                      权限标识示例：dba <br />
                      控制器中使用权限标识，如： <br />
                      @PreAuthorize({ hasRoles: ['dba'] })
                    </div>
                  </template>
                  <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </a-tooltip>
              </template>
            </a-input>
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="角色顺序" name="role_sort">
            <a-input-number
              v-model:value="form.role_sort"
              :min="0"
              :max="9999"
              :step="1"
              placeholder="排序值"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="角色说明"
        name="remark"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="!isView"
          placeholder="请输入角色说明"
        />
      </a-form-item>
      <a-form-item
        label="菜单权限"
        name="role_menu_check_strictly"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-space v-if="!isView" :size="12" align="center">
          <a-checkbox
            :checked="menuTreeState.expandedKeys.length > 0"
            @change="(e: any) => handleTreeExpand(e.target.checked)"
          >
            展开/折叠
          </a-checkbox>
          <a-checkbox
            :checked="form.menu_ids.length > 0"
            @change="(e: any) => handleTreeCheckAll(e.target.checked)"
          >
            全选/全不选
          </a-checkbox>
          <a-checkbox
            :checked="form.role_menu_check_strictly === '1'"
            @change="(e: any) => handleTreeCheckStrictly(e.target.checked)"
          >
            父子联动
          </a-checkbox>
        </a-space>
        <a-tree
          checkable
          :selectable="false"
          :disabled="isView"
          @check="(checked: any, info: any) => handleTreeCheck(checked, info)"
          v-model:expanded-keys="menuTreeState.expandedKeys"
          v-model:checked-keys="menuTreeState.checkedKeys"
          :check-strictly="form.role_menu_check_strictly === '0'"
          :tree-data="menuTreeState.treeData"
          :field-names="{ children: 'children', title: 'label', key: 'id' }"
          :height="256"
          :virtual="false"
          style="border: 1px solid #d9d9d9; border-radius: 6px; margin-top: 4px"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
