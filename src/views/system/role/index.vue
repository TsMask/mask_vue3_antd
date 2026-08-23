<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, reactive, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Modal } from 'ant-design-vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import type { DataNode } from 'ant-design-vue/es/tree';
import {
  exportRole,
  addRole,
  changeStatus,
  dataScope,
  delRole,
  getRole,
  listRole,
  updateRole,
} from '@/api/system/role';
import { menuTreeSelect, menuTreeSelectRole } from '@/api/system/menu';
import { deptTreeRole } from '@/api/system/dept';
import {
  parseTreeKeys,
  parseTreeNodeKeys,
  parseTreeNodeKeysByChecked,
} from '@/utils/parse-tree-utils';
import { parseDateToStr } from '@/utils/date-utils';
import { hasPermissions } from '@/plugins/auth-user';
import { isSuccess } from '@/plugins/http-fetch';
import { saveAs } from 'file-saver';
import { MENU_PATH_INLINE } from '@/constants/menu-constants';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system-constants';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useCrudModal } from '@/hooks/useCrudModal';
import { useAction, confirmAction } from '@/hooks/useAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const routePath = route.path;

/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

/** 列表数据查询 */
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
  rowSelection,
  selectedRowKeys,
  removeSelectedRowKeys,
} = useProTable({
  queryFn: listRole,
  defaultPageSize: 20,
  rowKey: 'id',
});

/** 新增/编辑提交 mutation */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (data: Record<string, any>) =>
    data.id ? updateRole(data) : addRole(data),
  successText: '操作成功',
  onSuccess: () => {
    handleCloseModal();
    reload();
  },
});

/** 数据权限提交 mutation */
const { execute: dataScopeExecute, loading: isDataScopeSubmitting } = useAction(
  {
    action: (data: Record<string, any>) => dataScope(data),
    successText: '操作成功',
  }
);

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '角色编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '角色名称', dataIndex: 'role_name', align: 'left', width: 100 },
  { title: '角色键值', dataIndex: 'role_key', align: 'left', width: 100 },
  { title: '角色顺序', dataIndex: 'role_sort', align: 'left', width: 100 },
  {
    title: '角色状态',
    dataIndex: 'role_status',
    key: 'role_status',
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
  { title: '操作', key: 'operation', align: 'left', width: 220 },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '角色名称', dataIndex: 'role_name' },
  { title: '角色键值', dataIndex: 'role_key' },
  {
    title: '角色状态',
    dataIndex: 'role_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间范围',
    dataIndex: 'create_time',
    valueType: 'dateTimeRange',
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        create_time_begin: value?.[0]?.valueOf(),
        create_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

/** 数据范围选项 */
const dataScopeOptions = ref<{ value: string; label: string }[]>([
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' },
]);

type TreeDataType = {
  treeData: DataNode[];
  checkedKeys: (string | number)[];
  expandedKeys: (string | number)[];
};

/** 菜单树和部门树的初始缓存 */
let menuTreeCache: TreeDataType = {
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};
let deptTreeCache: TreeDataType = {
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};

// ==================== 弹窗状态 ====================

let visibleByDataScope = ref(false);

/** CRUD 弹窗管理（单弹窗 + 模式驱动） */
const {
  modal,
  formCtl,
  isView,
  setForm,
  open,
  close: closeCrudModal,
} = useCrudModal({
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

/** 树勾选与数据权限弹窗共用同一份表单，保留既有引用名 */
const form = modal.form;

let menuTreeState = reactive<TreeDataType>({
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
});

let deptTreeState = reactive<TreeDataType>({
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
});

// ==================== 弹窗操作 ====================

/** 打开详情弹窗 */
async function handleView(role_id: string | number) {
  if (!role_id || modal.confirmLoading) return;
  modal.confirmLoading = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const [roleRes, menuRes] = await Promise.all([
      getRole(role_id),
      menuTreeSelectRole(role_id),
    ]);
    if (isSuccess(roleRes) && roleRes.data) {
      setForm(roleRes.data);
      if (isSuccess(menuRes) && menuRes.data) {
        const { menus, checked_keys = [] } = menuRes.data;
        menuTreeCache.checkedKeys = parseTreeKeys(menus, 'id');
        menuTreeCache.expandedKeys = parseTreeNodeKeys(menus, 'id');
        menuTreeCache.treeData = menus;
        menuTreeState.treeData = menus;
        menuTreeState.checkedKeys = checked_keys;
        if (form.role_menu_check_strictly === '1') {
          const ids = parseTreeNodeKeysByChecked(menus, checked_keys, 'id');
          form.menu_ids = ids.concat(checked_keys);
        } else {
          form.menu_ids = checked_keys;
        }
      }
      open('view', '角色信息');
    }
  } finally {
    hide();
    modal.confirmLoading = false;
  }
}

/** 打开新增/编辑弹窗 */
async function handleOpenEdit(role_id?: string | number) {
  if (!role_id) {
    formCtl.resetFields();
    if (menuTreeCache.treeData.length > 0) {
      menuTreeState.treeData = menuTreeCache.treeData;
      open('add', '添加角色信息');
    } else {
      if (modal.confirmLoading) return;
      modal.confirmLoading = true;
      const hide = message.loading('正在打开...', 0);
      try {
        const res = await menuTreeSelect();
        if (isSuccess(res) && Array.isArray(res.data)) {
          menuTreeCache.checkedKeys = parseTreeKeys(res.data, 'id');
          menuTreeCache.expandedKeys = parseTreeNodeKeys(res.data, 'id');
          menuTreeCache.treeData = res.data;
          menuTreeState.treeData = res.data;
          open('add', '添加角色信息');
        }
      } finally {
        hide();
        modal.confirmLoading = false;
      }
    }
  } else {
    if (modal.confirmLoading) return;
    modal.confirmLoading = true;
    const hide = message.loading('正在打开...', 0);
    try {
      const [roleRes, menuRes] = await Promise.all([
        getRole(role_id),
        menuTreeSelectRole(role_id),
      ]);
      if (isSuccess(roleRes) && roleRes.data) {
        setForm(roleRes.data);
        if (isSuccess(menuRes) && menuRes.data) {
          const { menus, checked_keys = [] } = menuRes.data;
          menuTreeCache.checkedKeys = parseTreeKeys(menus, 'id');
          menuTreeCache.expandedKeys = parseTreeNodeKeys(menus, 'id');
          menuTreeCache.treeData = menus;
          menuTreeState.treeData = menus;
          menuTreeState.checkedKeys = checked_keys;
          if (form.role_menu_check_strictly === '1') {
            const ids = parseTreeNodeKeysByChecked(menus, checked_keys, 'id');
            form.menu_ids = ids.concat(checked_keys);
          } else {
            form.menu_ids = checked_keys;
          }
        }
        open('edit', '修改角色信息');
      }
    } finally {
      hide();
      modal.confirmLoading = false;
    }
  }
}

/** 表单提交确认 */
async function handleSubmit() {
  try {
    await formCtl.validate();
  } catch (e: any) {
    message.error({
      content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }
  current.value = 1;
  await submitExecute(toRaw(form));
}

/** 关闭所有弹窗 */
function handleCloseModal() {
  closeCrudModal();
  visibleByDataScope.value = false;
  formCtl.resetFields();
  menuTreeState.checkedKeys = [];
  menuTreeState.expandedKeys = [];
  deptTreeState.checkedKeys = [];
  deptTreeState.expandedKeys = [];
}

/** 树节点勾选事件 */
function handleTreeCheck(keys: any, info: any, type: 'menu' | 'dept') {
  let ids = Array.isArray(keys) ? keys : keys.checked;
  if (type === 'menu') {
    if (form.role_menu_check_strictly === '1')
      ids = ids.concat(info.halfCheckedKeys);
    form.menu_ids = ids;
  }
  if (type === 'dept') {
    if (form.role_dept_check_strictly === '1')
      ids = ids.concat(info.halfCheckedKeys);
    form.dept_ids = ids;
  }
}

/** 树展开/折叠 */
function handleTreeExpand(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu')
    menuTreeState.expandedKeys = checked ? menuTreeCache.expandedKeys : [];
  if (type === 'dept')
    deptTreeState.expandedKeys = checked ? deptTreeCache.expandedKeys : [];
}

/** 树全选/全不选 */
function handleTreeCheckAll(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') {
    menuTreeState.checkedKeys = checked ? menuTreeCache.checkedKeys : [];
    form.menu_ids = menuTreeState.checkedKeys;
  }
  if (type === 'dept') {
    deptTreeState.checkedKeys = checked ? deptTreeCache.checkedKeys : [];
    form.dept_ids = deptTreeState.checkedKeys;
  }
}

/** 树父子联动切换 */
function handleTreeCheckStrictly(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') form.role_menu_check_strictly = checked ? '1' : '0';
  if (type === 'dept') form.role_dept_check_strictly = checked ? '1' : '0';
}

// ==================== 数据权限 ====================

/** 分配数据权限确认 */
async function handleDataScopeSubmit() {
  const formRaw = toRaw(form);
  if (formRaw.role_data_scope !== '2') formRaw.dept_ids = [];
  try {
    await dataScopeExecute({ ...formRaw, role_id: formRaw.id });
    visibleByDataScope.value = false;
    formCtl.resetFields();
  } catch {
    // 错误已由 useAction 统一处理
  }
}

/** 打开分配数据权限弹窗 */
async function handleOpenDataScope(role_id: string | number) {
  if (!role_id || modal.confirmLoading) return;
  modal.confirmLoading = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const [roleRes, deptRes] = await Promise.all([
      getRole(role_id),
      deptTreeRole(role_id),
    ]);
    if (isSuccess(roleRes) && roleRes.data) {
      setForm(roleRes.data);
      if (isSuccess(deptRes) && deptRes.data) {
        const { depts, checked_keys = [] } = deptRes.data;
        deptTreeCache.checkedKeys = parseTreeKeys(depts, 'id');
        deptTreeCache.expandedKeys = parseTreeNodeKeys(depts, 'id');
        deptTreeCache.treeData = depts;
        deptTreeState.treeData = depts;
        deptTreeState.checkedKeys = checked_keys;
        if (form.role_dept_check_strictly === '1') {
          const ids = parseTreeNodeKeysByChecked(depts, checked_keys, 'id');
          form.dept_ids = ids.concat(checked_keys);
        } else {
          form.dept_ids = checked_keys;
        }
      }
      visibleByDataScope.value = true;
    }
  } finally {
    hide();
    modal.confirmLoading = false;
  }
}

// ==================== 列表操作 ====================

/** 角色分配用户跳转 */
function handleAuthUser(row: Record<string, string>) {
  router.push({
    path: `${routePath}${MENU_PATH_INLINE}/auth-user/${row.id}`,
    query: { role_name: row.role_name },
  });
}

/** 角色状态修改（保留 Modal.confirm 以支持取消回滚） */
function handleStatusChange(row: Record<string, string>) {
  const text = row.role_status === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.role_name} 角色吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      return changeStatus(row.id, row.role_status)
        .then(res => {
          hide();
          if (isSuccess(res)) {
            message.success({
              content: `${row.role_name} ${text}成功`,
              duration: 3,
            });
            reload();
          } else {
            message.error({ content: res.msg, duration: 3 });
          }
        })
        .catch(err => {
          hide();
          message.error({ content: err.message || '操作失败', duration: 3 });
        });
    },
    onCancel() {
      row.role_status = row.role_status === '1' ? '0' : '1';
    },
  });
}

/** 角色删除（二次确认后执行） */
function handleDelete(role_id: string = '0') {
  if (role_id === '0') {
    role_id = selectedRowKeys.value.join(',');
  }
  confirmAction({
    content: `确认删除角色编号为 【${role_id}】 的数据项?`,
    action: () => delRole(role_id),
    variables: undefined,
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(role_id).split(',').map(Number));
      reload();
    },
  });
}

/** 列表导出 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () => {
      return exportRole({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    variables: undefined,
    successText: '已完成导出',
    onSuccess: res => saveAs(res.data, `role_${Date.now()}.csv`),
  });
}
</script>
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        给予用户角色标记，可分配给用户多个角色，分配数据权限需要关联部门数据表进行相关配置生效。
      </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      @change="onTableChange"
      :scroll="tableScroll"
      :search="{
        columns: searchColumns,
        labelWidth: 100,
        labelWrap: true,
        onSearch,
        onReset,
      }"
      :toolbar="{
        setting: { columnsStateKey: 'system-role', columnsStateType: 'local' },
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
            v-perms:has="['system:role:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()"
            v-perms:has="['system:role:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:role:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role_status'">
          <a-switch
            v-if="
              dict.sysNormalDisable.length > 0 &&
              record.id !== SYS_ROLE_SYSTEM_ID &&
              !userStore.roles.includes(record.role_key) &&
              hasPermissions(['system:role:edit'])
            "
            v-model:checked="record.role_status"
            checked-value="1"
            :checked-children="dict.sysNormalDisable[0].label"
            un-checked-value="0"
            :un-checked-children="dict.sysNormalDisable[1].label"
            size="small"
            @change="handleStatusChange(record)"
          />
          <DictTag
            v-else
            :options="dict.sysNormalDisable"
            :value="record.role_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:role:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="
                record.id !== SYS_ROLE_SYSTEM_ID &&
                !userStore.roles.includes(record.role_key)
              "
            >
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleOpenEdit(record.id)"
                v-perms:has="['system:role:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="
                record.id !== SYS_ROLE_SYSTEM_ID &&
                !userStore.roles.includes(record.role_key)
              "
            >
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:role:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="record.id !== SYS_ROLE_SYSTEM_ID"
            >
              <template #title>分配数据权限</template>
              <a-button
                type="link"
                @click.prevent="handleOpenDataScope(record.id)"
                v-perms:has="['system:role:edit']"
              >
                <template #icon>
                  <SecurityScanOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="record.id !== SYS_ROLE_SYSTEM_ID"
            >
              <template #title>分配用户</template>
              <a-button
                type="link"
                @click.prevent="handleAuthUser(record)"
                v-perms:has="['system:role:auth']"
              >
                <template #icon>
                  <TeamOutlined />
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
      :open="modal.visible"
      :title="modal.title"
      :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined"
      @ok="handleSubmit"
      @cancel="handleCloseModal"
    >
      <a-form
        name="formCtlByEdit"
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
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="role_status">
              <a-select
                v-model:value="form.role_status"
                default-value="0"
                placeholder="角色状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
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
                  <a-tooltip placement="topLeft">
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
              ></a-input-number>
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
              id="menu_1"
              :checked="menuTreeState.expandedKeys.length > 0"
              @change="(e: any) => handleTreeExpand(e.target.checked, 'menu')"
            >
              展开/折叠
            </a-checkbox>
            <a-checkbox
              id="menu_2"
              :checked="form.menu_ids.length > 0"
              @change="(e: any) => handleTreeCheckAll(e.target.checked, 'menu')"
            >
              全选/全不选
            </a-checkbox>
            <a-checkbox
              id="menu_3"
              :checked="form.role_menu_check_strictly === '1'"
              @change="
                (e: any) => handleTreeCheckStrictly(e.target.checked, 'menu')
              "
            >
              父子联动
            </a-checkbox>
          </a-space>
          <a-tree
            checkable
            :selectable="false"
            :disabled="isView"
            @check="
              (checked: any, info: any) =>
                handleTreeCheck(checked, info, 'menu')
            "
            v-model:expanded-keys="menuTreeState.expandedKeys"
            v-model:checked-keys="menuTreeState.checkedKeys"
            :check-strictly="form.role_menu_check_strictly === '0'"
            :tree-data="menuTreeState.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }"
            :height="256"
            style="
              border-width: 1px;
              border-style: solid;
              border-color: #d9d9d9;
              border-radius: 6px;
              margin-top: 4px;
            "
          >
          </a-tree>
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 分配角色数据权限修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="false"
      :mask-closable="false"
      :open="visibleByDataScope"
      title="分配数据权限"
      :confirm-loading="isDataScopeSubmitting"
      @ok="handleDataScopeSubmit"
      @cancel="handleCloseModal"
    >
      <a-form name="formCtlByDataScope" layout="horizontal">
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
            :options="dataScopeOptions"
          >
          </a-select>
        </a-form-item>
        <a-form-item
          label="数据权限"
          name="role_dept_check_strictly"
          v-show="form.role_data_scope === '2'"
        >
          <a-space :size="12" align="center">
            <a-checkbox
              id="dept_1"
              :checked="deptTreeState.expandedKeys.length > 0"
              @change="(e: any) => handleTreeExpand(e.target.checked, 'dept')"
            >
              展开/折叠
            </a-checkbox>
            <a-checkbox
              id="dept_2"
              :checked="form.dept_ids.length > 0"
              @change="(e: any) => handleTreeCheckAll(e.target.checked, 'dept')"
            >
              全选/全不选
            </a-checkbox>
            <a-checkbox
              id="dept_3"
              :checked="form.role_dept_check_strictly === '1'"
              @change="
                (e: any) => handleTreeCheckStrictly(e.target.checked, 'dept')
              "
            >
              父子联动
            </a-checkbox>
          </a-space>
          <a-tree
            checkable
            :selectable="false"
            @check="
              (checked: any, info: any) =>
                handleTreeCheck(checked, info, 'dept')
            "
            v-model:expanded-keys="deptTreeState.expandedKeys"
            v-model:checked-keys="deptTreeState.checkedKeys"
            :check-strictly="form.role_dept_check_strictly === '0'"
            :tree-data="deptTreeState.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }"
            :height="256"
            style="
              border-width: 1px;
              border-style: solid;
              border-color: #d9d9d9;
              border-radius: 6px;
              margin-top: 4px;
            "
          >
          </a-tree>
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
