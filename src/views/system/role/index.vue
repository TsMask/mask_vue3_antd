<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Modal, Form } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'ant-design-vue/es/table';
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
import { saveAs } from 'file-saver';
import { MENU_PATH_INLINE } from '@/constants/menu-constants';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system-constants';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useMessageAction } from '@/hooks/useMessageAction';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const routePath = route.path;

/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysNormalDisable: 'sys_normal_disable',
});

/** 通用操作反馈 */
const { withLoading, confirmAndRun } = useMessageAction();

/** 开始结束时间 */
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    roleName: '',
    roleKey: '',
    statusFlag: undefined,
    beginTime: undefined as undefined | number,
    endTime: undefined as undefined | number,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    queryRangePicker.value = undefined;
    resetPage();
    fetchList();
  },
);

/** 分页管理 */
const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

/** 表格UI状态 */
const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } =
  useTableUI();

/** 表格字段列 */
let tableColumns: ColumnsType = [
  { title: '角色编号', dataIndex: 'roleId', align: 'left', width: 100 },
  { title: '角色名称', dataIndex: 'roleName', align: 'left', width: 100 },
  { title: '角色键值', dataIndex: 'roleKey', align: 'left', width: 100 },
  { title: '角色顺序', dataIndex: 'roleSort', align: 'left', width: 100 },
  { title: '角色状态', dataIndex: 'statusFlag', key: 'statusFlag', align: 'left', width: 100 },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  { title: '操作', key: 'roleId', align: 'left' },
];

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
let menuTreeCache: TreeDataType = { treeData: [], checkedKeys: [], expandedKeys: [] };
let deptTreeCache: TreeDataType = { treeData: [], checkedKeys: [], expandedKeys: [] };

// ==================== 弹窗状态 ====================

let visibleByView = ref(false);
let visibleByEdit = ref(false);
let visibleByDataScope = ref(false);
let modalTitle = ref('角色');
let confirmLoading = ref(false);

const form = reactive({
  roleId: undefined as string | number | undefined,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  statusFlag: '0',
  menuIds: [] as (string | number)[],
  deptIds: [] as (string | number)[],
  remark: '',
  dataScope: '5',
  deptCheckStrictly: '1',
  menuCheckStrictly: '1',
  createTime: 0,
});

const formCtl = Form.useForm(
  form,
  reactive({
    roleName: [{ required: true, min: 1, max: 30, message: '请正确输入角色名称' }],
    roleKey: [{ required: true, min: 1, max: 50, message: '请正确输入角色键值' }],
  }),
);

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
async function handleView(roleId: string | number) {
  if (!roleId || confirmLoading.value) return;
  confirmLoading.value = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const [roleRes, menuRes] = await Promise.all([
      getRole(roleId),
      menuTreeSelectRole(roleId),
    ]);
    if (roleRes.code === RESULT_CODE_SUCCESS && roleRes.data) {
      Object.assign(form, roleRes.data);
      if (menuRes.code === RESULT_CODE_SUCCESS && menuRes.data) {
        const { menus, checkedKeys } = menuRes.data;
        menuTreeCache.checkedKeys = parseTreeKeys(menus, 'id');
        menuTreeCache.expandedKeys = parseTreeNodeKeys(menus, 'id');
        menuTreeCache.treeData = menus;
        menuTreeState.treeData = menus;
        menuTreeState.checkedKeys = checkedKeys;
        if (form.menuCheckStrictly === '1') {
          const ids = parseTreeNodeKeysByChecked(menus, checkedKeys, 'id');
          form.menuIds = ids.concat(checkedKeys);
        } else {
          form.menuIds = checkedKeys;
        }
      }
      modalTitle.value = '角色信息';
      visibleByView.value = true;
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

/** 打开新增/编辑弹窗 */
async function handleOpenEdit(roleId?: string | number) {
  if (!roleId) {
    formCtl.resetFields();
    if (menuTreeCache.treeData.length > 0) {
      menuTreeState.treeData = menuTreeCache.treeData;
      modalTitle.value = '添加角色信息';
      visibleByEdit.value = true;
    } else {
      if (confirmLoading.value) return;
      confirmLoading.value = true;
      const hide = message.loading('正在打开...', 0);
      try {
        const res = await menuTreeSelect();
        if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
          menuTreeCache.checkedKeys = parseTreeKeys(res.data, 'id');
          menuTreeCache.expandedKeys = parseTreeNodeKeys(res.data, 'id');
          menuTreeCache.treeData = res.data;
          menuTreeState.treeData = res.data;
          modalTitle.value = '添加角色信息';
          visibleByEdit.value = true;
        }
      } finally {
        hide();
        confirmLoading.value = false;
      }
    }
  } else {
    if (confirmLoading.value) return;
    confirmLoading.value = true;
    const hide = message.loading('正在打开...', 0);
    try {
      const [roleRes, menuRes] = await Promise.all([
        getRole(roleId),
        menuTreeSelectRole(roleId),
      ]);
      if (roleRes.code === RESULT_CODE_SUCCESS && roleRes.data) {
        Object.assign(form, roleRes.data);
        if (menuRes.code === RESULT_CODE_SUCCESS && menuRes.data) {
          const { menus, checkedKeys } = menuRes.data;
          menuTreeCache.checkedKeys = parseTreeKeys(menus, 'id');
          menuTreeCache.expandedKeys = parseTreeNodeKeys(menus, 'id');
          menuTreeCache.treeData = menus;
          menuTreeState.treeData = menus;
          menuTreeState.checkedKeys = checkedKeys;
          if (form.menuCheckStrictly === '1') {
            const ids = parseTreeNodeKeysByChecked(menus, checkedKeys, 'id');
            form.menuIds = ids.concat(checkedKeys);
          } else {
            form.menuIds = checkedKeys;
          }
        }
        modalTitle.value = '修改角色信息';
        visibleByEdit.value = true;
      }
    } finally {
      hide();
      confirmLoading.value = false;
    }
  }
}

/** 表单提交确认 */
async function handleSubmit() {
  try {
    await formCtl.validate();
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  const hide = message.loading('请稍等...', 0);
  confirmLoading.value = true;
  try {
    const formRaw = toRaw(form);
    const res = formRaw.roleId ? await updateRole(formRaw) : await addRole(formRaw);
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({ content: `${modalTitle.value}成功`, duration: 3 });
      fetchList(1);
      handleCloseModal();
    } else {
      message.error({ content: res.msg, duration: 3 });
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

/** 关闭所有弹窗 */
function handleCloseModal() {
  visibleByEdit.value = false;
  visibleByView.value = false;
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
    if (form.menuCheckStrictly === '1') ids = ids.concat(info.halfCheckedKeys);
    form.menuIds = ids;
  }
  if (type === 'dept') {
    if (form.deptCheckStrictly === '1') ids = ids.concat(info.halfCheckedKeys);
    form.deptIds = ids;
  }
}

/** 树展开/折叠 */
function handleTreeExpand(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') menuTreeState.expandedKeys = checked ? menuTreeCache.expandedKeys : [];
  if (type === 'dept') deptTreeState.expandedKeys = checked ? deptTreeCache.expandedKeys : [];
}

/** 树全选/全不选 */
function handleTreeCheckAll(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') {
    menuTreeState.checkedKeys = checked ? menuTreeCache.checkedKeys : [];
    form.menuIds = menuTreeState.checkedKeys;
  }
  if (type === 'dept') {
    deptTreeState.checkedKeys = checked ? deptTreeCache.checkedKeys : [];
    form.deptIds = deptTreeState.checkedKeys;
  }
}

/** 树父子联动切换 */
function handleTreeCheckStrictly(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') form.menuCheckStrictly = checked ? '1' : '0';
  if (type === 'dept') form.deptCheckStrictly = checked ? '1' : '0';
}

// ==================== 数据权限 ====================

/** 分配数据权限确认 */
async function handleDataScopeSubmit() {
  if (confirmLoading.value) return;
  const hide = message.loading('请稍等...', 0);
  confirmLoading.value = true;
  try {
    const formRaw = toRaw(form);
    if (formRaw.dataScope !== '2') formRaw.deptIds = [];
    const res = await dataScope(formRaw);
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({ content: `${modalTitle.value}成功`, duration: 3 });
      visibleByDataScope.value = false;
      formCtl.resetFields();
    } else {
      message.error({ content: res.msg, duration: 3 });
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

/** 打开分配数据权限弹窗 */
async function handleOpenDataScope(roleId: string | number) {
  if (!roleId || confirmLoading.value) return;
  confirmLoading.value = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const [roleRes, deptRes] = await Promise.all([
      getRole(roleId),
      deptTreeRole(roleId),
    ]);
    if (roleRes.code === RESULT_CODE_SUCCESS && roleRes.data) {
      Object.assign(form, roleRes.data);
      if (deptRes.code === RESULT_CODE_SUCCESS && deptRes.data) {
        const { depts, checkedKeys } = deptRes.data;
        deptTreeCache.checkedKeys = parseTreeKeys(depts, 'id');
        deptTreeCache.expandedKeys = parseTreeNodeKeys(depts, 'id');
        deptTreeCache.treeData = depts;
        deptTreeState.treeData = depts;
        deptTreeState.checkedKeys = checkedKeys;
        if (form.deptCheckStrictly === '1') {
          const ids = parseTreeNodeKeysByChecked(depts, checkedKeys, 'id');
          form.deptIds = ids.concat(checkedKeys);
        } else {
          form.deptIds = checkedKeys;
        }
      }
      modalTitle.value = '分配数据权限';
      visibleByDataScope.value = true;
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

// ==================== 列表操作 ====================

/** 角色分配用户跳转 */
function handleAuthUser(row: Record<string, string>) {
  router.push({
    path: `${routePath}${MENU_PATH_INLINE}/auth-user/${row.roleId}`,
    query: { roleName: row.roleName },
  });
}

/** 角色状态修改 */
function handleStatusChange(row: Record<string, string>) {
  const text = row.statusFlag === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.roleName} 角色吗?`,
    onOk() {
      return withLoading(changeStatus(row.roleId, row.statusFlag), {
        successText: `${row.roleName} ${text}成功`,
      }).then(() => fetchList());
    },
    onCancel() {
      row.statusFlag = row.statusFlag === '1' ? '0' : '1';
    },
  });
}

/** 角色删除 */
function handleDelete(roleId: string = '0') {
  if (roleId === '0') {
    roleId = tableState.selectedRowKeys.join(',');
  }
  confirmAndRun({
    content: `确认删除角色编号为 【${roleId}】 的数据项?`,
    onOk: () => delRole(roleId),
    successText: '删除成功',
    onSuccess: () => fetchList(),
  });
}

/** 列表导出 */
function handleExport() {
  confirmAndRun({
    content: '确认根据搜索条件导出xlsx表格文件吗?',
    onOk: () => exportRole(toRaw(queryParams)),
    successText: '已完成导出',
    onSuccess: (res) => { saveAs(res.data, `role_${Date.now()}.xlsx`); },
  });
}

/** 查询角色列表 */
function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) queryParams.pageNum = pageNum;
  // 时间范围
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.beginTime = queryRangePicker.value[0].startOf('day').valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf('day').valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
  listRole(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      clearSelection();
      const { total, rows } = res.data;
      setTotal(total);
      tableState.data = rows;
      // 删除后修正页码，避免空页面
      if (fixPageAfterDelete(rows.length)) {
        fetchList();
        return;
      }
    }
    tableState.loading = false;
  });
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
        给予用户角色标记，可分配给用户多个角色，分配数据权限需要关联部门数据表进行相关配置生效。
      </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              <a-input v-model:value="queryParams.roleName" allow-clear placeholder="请输入角色名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey">
              <a-input v-model:value="queryParams.roleKey" allow-clear placeholder="请输入角色键值"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="8" :md="12" :xs="24">
            <a-form-item label="创建时间" name="queryRangePicker">
              <a-range-picker v-model:value="queryRangePicker" :bordered="true" :allow-clear="true"
                style="width: 100%"></a-range-picker>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fetchList(1)">
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
      <!-- 插槽-卡片左侧侧 -->
      <template #title>
        <a-space :size="8" align="center">
          <a-button type="primary" @click.prevent="handleOpenEdit()" v-perms:has="['system:role:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:role:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:role:export']">
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
            <a-switch v-model:checked="tableState.seached" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList()">
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
      <a-table class="table" row-key="roleId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName" :pagination="pagination"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <a-switch v-if="
              dict.sysNormalDisable.length > 0 &&
              record.roleId !== SYS_ROLE_SYSTEM_ID &&
              !userStore.roles.includes(record.roleKey) &&
              hasPermissions(['system:role:edit'])
            " v-model:checked="record.statusFlag" checked-value="1" :checked-children="dict.sysNormalDisable[0].label"
              un-checked-value="0" :un-checked-children="dict.sysNormalDisable[1].label" size="small"
              @change="handleStatusChange(record)" />
            <DictTag v-else :options="dict.sysNormalDisable" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'roleId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.roleId)" v-perms:has="['system:role:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="
                record.roleId !== SYS_ROLE_SYSTEM_ID &&
                !userStore.roles.includes(record.roleKey)
              ">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleOpenEdit(record.roleId)" v-perms:has="['system:role:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="
                record.roleId !== SYS_ROLE_SYSTEM_ID &&
                !userStore.roles.includes(record.roleKey)
              ">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.roleId)" v-perms:has="['system:role:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.roleId !== SYS_ROLE_SYSTEM_ID">
                <template #title>分配数据权限</template>
                <a-button type="link" @click.prevent="handleOpenDataScope(record.roleId)"
                  v-perms:has="['system:role:edit']">
                  <template #icon>
                    <SecurityScanOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.roleId !== SYS_ROLE_SYSTEM_ID">
                <template #title>分配用户</template>
                <a-button type="link" @click.prevent="handleAuthUser(record)" v-perms:has="['system:role:auth']">
                  <template #icon>
                    <TeamOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="visibleByView" :title="modalTitle" @cancel="handleCloseModal">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色编号" name="roleId">
              {{ form.roleId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+form.createTime > 0">
                {{ parseDateToStr(+form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色顺序" name="roleSort">
              {{ form.roleSort }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <DictTag :options="dict.sysNormalDisable" :value="form.statusFlag" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              {{ form.roleName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey">
              {{ form.roleKey }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="角色说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>

        <a-form-item label="菜单权限" name="menuCheckStrictly" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree disabled checkable :selectable="false" v-model:expanded-keys="menuTreeState.expandedKeys"
            v-model:checked-keys="menuTreeState.checkedKeys" :check-strictly="form.menuCheckStrictly === '0'"
            :tree-data="menuTreeState.treeData" :field-names="{ children: 'children', title: 'label', key: 'id' }"
            :height="256" style="border: 1px solid #d9d9d9; margin-top: 4px">
          </a-tree>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCloseModal">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="visibleByEdit" :title="modalTitle" :confirm-loading="confirmLoading" @ok="handleSubmit"
      @cancel="handleCloseModal">
      <a-form name="formCtlByEdit" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName" v-bind="formCtl.validateInfos.roleName">
              <a-input v-model:value="form.roleName" allow-clear placeholder="请输入角色名称" :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <a-select v-model:value="form.statusFlag" default-value="0" placeholder="角色状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey" v-bind="formCtl.validateInfos.roleKey">
              <a-input v-model:value="form.roleKey" allow-clear placeholder="请输入角色键值" :maxlength="50">
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
            <a-form-item label="角色顺序" name="roleSort">
              <a-input-number v-model:value="form.roleSort" :min="0" :max="9999" :step="1"
                placeholder="排序值"></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="角色说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入角色说明" />
        </a-form-item>

        <a-form-item label="菜单权限" name="menuCheckStrictly" :label-col="{ span: 3 }" :label-wrap="true">
          <a-space :size="12" align="center">
            <a-checkbox id="menu_1" :checked="menuTreeState.expandedKeys.length > 0"
              @change="(e: any) => handleTreeExpand(e.target.checked, 'menu')">
              展开/折叠
            </a-checkbox>
            <a-checkbox id="menu_2" :checked="form.menuIds.length > 0"
              @change="(e: any) => handleTreeCheckAll(e.target.checked, 'menu')">
              全选/全不选
            </a-checkbox>
            <a-checkbox id="menu_3" :checked="form.menuCheckStrictly === '1'"
              @change="(e: any) => handleTreeCheckStrictly(e.target.checked, 'menu')">
              父子联动
            </a-checkbox>
          </a-space>
          <a-tree checkable :selectable="false" @check="
            (checked: any, info: any) => handleTreeCheck(checked, info, 'menu')
          " v-model:expanded-keys="menuTreeState.expandedKeys" v-model:checked-keys="menuTreeState.checkedKeys"
            :check-strictly="form.menuCheckStrictly === '0'" :tree-data="menuTreeState.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }" :height="256" style="
              border-width: 1px;
              border-style: solid;
              border-color: #d9d9d9;
              border-radius: 6px;
              margin-top: 4px;
            ">
          </a-tree>
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 分配角色数据权限修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="visibleByDataScope" :title="modalTitle" :confirm-loading="confirmLoading" @ok="handleDataScopeSubmit"
      @cancel="handleCloseModal">
      <a-form name="formCtlByDataScope" layout="horizontal">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色编号" name="roleId">
              {{ form.roleId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+form.createTime > 0">
                {{ parseDateToStr(+form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色顺序" name="roleSort">
              {{ form.roleSort }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <DictTag :options="dict.sysNormalDisable" :value="form.statusFlag" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              {{ form.roleName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey">
              {{ form.roleKey }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="角色说明" name="remark">
          <a-textarea :value="form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>

        <a-form-item label="权限范围" name="dataScope">
          <a-select v-model:value="form.dataScope" default-value="5" placeholder="权限范围" :options="dataScopeOptions">
          </a-select>
        </a-form-item>
        <a-form-item label="数据权限" name="deptCheckStrictly" v-show="form.dataScope === '2'">
          <a-space :size="12" align="center">
            <a-checkbox id="dept_1" :checked="deptTreeState.expandedKeys.length > 0"
              @change="(e: any) => handleTreeExpand(e.target.checked, 'dept')">
              展开/折叠
            </a-checkbox>
            <a-checkbox id="dept_2" :checked="form.deptIds.length > 0"
              @change="(e: any) => handleTreeCheckAll(e.target.checked, 'dept')">
              全选/全不选
            </a-checkbox>
            <a-checkbox id="dept_1" :checked="form.deptCheckStrictly === '1'"
              @change="(e: any) => handleTreeCheckStrictly(e.target.checked, 'dept')">
              父子联动
            </a-checkbox>
          </a-space>
          <a-tree checkable :selectable="false" @check="
            (checked: any, info: any) => handleTreeCheck(checked, info, 'dept')
          " v-model:expanded-keys="deptTreeState.expandedKeys" v-model:checked-keys="deptTreeState.checkedKeys"
            :check-strictly="form.deptCheckStrictly === '0'" :tree-data="deptTreeState.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }" :height="256" style="
              border-width: 1px;
              border-style: solid;
              border-color: #d9d9d9;
              border-radius: 6px;
              margin-top: 4px;
            ">
          </a-tree>
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
