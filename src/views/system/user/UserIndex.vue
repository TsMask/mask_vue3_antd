<script setup lang="ts">
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import { ref, computed, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import UserFormModal from './components/UserFormModal.vue';
import UserResetPasswordModal from './components/UserResetPasswordModal.vue';
import UserImportModal from './components/UserImportModal.vue';
import {
  exportUser,
  changeStatus,
  listUser,
  delUser,
  unlock,
} from '@/api/system/user';
import { deptTree } from '@/api/system/dept';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date';
import { isSuccess } from '@/api/httpClient';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

// ==================== 字典 ====================

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
  },
});

// ==================== 查询 / 分页 / 列表 ====================

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
  queryFn: listUser,
  defaultPageSize: 20,
  rowKey: 'id',
});

// ==================== 部门树 ====================

const deptTreeData = ref<Record<string, any>[]>([]);

const userFormModal = ref<InstanceType<typeof UserFormModal> | null>(null);
const resetPasswordModal = ref<InstanceType<
  typeof UserResetPasswordModal
> | null>(null);
const importModal = ref<InstanceType<typeof UserImportModal> | null>(null);

// ==================== 表格列 ====================

/** 表格展示列，只描述列表区域 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '用户编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'user_name', align: 'left', width: 100 },
  { title: '用户昵称', dataIndex: 'user_nick', align: 'left', width: 100 },
  { title: '手机号码', dataIndex: 'user_phone', align: 'left', width: 120 },
  {
    title: '部门名称',
    dataIndex: 'dept_id',
    key: 'dept_id',
    align: 'left',
    width: 100,
  },
  {
    title: '登录地址',
    dataIndex: 'user_login_ip',
    key: 'user_login_ip',
    align: 'left',
    width: 100,
  },
  {
    title: '登录时间',
    dataIndex: 'user_login_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    key: 'user_status',
    align: 'left',
    width: 100,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 210,
    fixed: 'right',
  },
]);

/** 查询表单项，独立于表格展示列 */
const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '登录账号', dataIndex: 'user_name', fieldProps: { maxlength: 30 } },
  { title: '手机号码', dataIndex: 'user_phone', fieldProps: { maxlength: 11 } },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    key: 'user_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '部门名称',
    dataIndex: 'dept_id',
    key: 'dept_id',
    valueType: 'treeSelect',
    colSize: 2,
    fieldProps: {
      treeData: deptTreeData.value,
      fieldNames: { children: 'children', label: 'label', value: 'id' },
      treeDefaultExpandAll: true,
      allowClear: true,
      style: { width: '100%' },
    },
  },
  {
    title: '登录时间范围',
    dataIndex: 'login_time',
    valueType: 'dateTimeRange',
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        login_time_begin: value?.[0]?.valueOf(),
        login_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

// ==================== 查看 / 编辑表单弹窗 ====================

function handleView(user_id: string | number) {
  userFormModal.value?.openView(user_id);
}

function handleEdit(user_id?: string | number) {
  userFormModal.value?.openEdit(user_id);
}

const { confirmAction } = useModalAction();

/** 保存成功后回到第一页，避免停留在已失效的分页位置 */
function handleFormSuccess() {
  current.value = 1;
  reload();
}

function handleResetPassword(row: Record<string, any>) {
  resetPasswordModal.value?.open(row);
}

// ==================== 列表操作 ====================

/** 状态修改（取消确认时回滚开关状态） */
function handleStatusChange(row: Record<string, any>) {
  const text = row.user_status === '1' ? '启用' : '停用';
  confirmAction({
    content: `确定要${text} ${row.user_name} 用户吗?`,
    action: () => changeStatus(row.id, row.user_status),
    successText: `${row.user_name} ${text}成功`,
    onSuccess() {
      reload();
    },
    onCancel() {
      row.user_status = row.user_status === '1' ? '0' : '1';
    },
  });
}

/** 支持行内删除和批量删除，默认 0 表示使用当前选中行 */
function handleDelete(user_id: string = '0') {
  const id = user_id === '0' ? selectedRowKeys.value.join(',') : user_id;
  confirmAction({
    content: `确认删除用户编号为 【${id}】 的数据项?`,
    action: () => delUser(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

/** 解除登录锁定，不影响用户状态和密码 */
function handleUnlock(user_name: string) {
  confirmAction({
    content: `确认解锁用户 ${user_name} ?`,
    action: () => unlock(user_name),
    successText: `用户 ${user_name} 解锁成功`,
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () => {
      return exportUser({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    successText: '已完成导出',
    onSuccess: res => saveAs(res.data, `user_${Date.now()}.csv`),
  });
}

function handleImport() {
  importModal.value?.open();
}

/** 导入会批量改变数据分布，成功后从第一页重新查询 */
function handleImported() {
  current.value = 1;
  reload();
}

// ==================== 初始化 ====================

/** 加载部门树，同时供查询条件和用户表单使用 */
async function handleLoadDeptTree() {
  try {
    const res = await deptTree();
    if (isSuccess(res) && Array.isArray(res.data)) {
      deptTreeData.value = res.data;
    }
  } catch (error: any) {
    message.error({
      content: error?.message || '获取部门树失败',
      duration: 3,
    });
  }
}

onMounted(() => {
  handleLoadDeptTree();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 所有系统用户管理列表 </a-typography-paragraph>
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
        setting: { columnsStateKey: 'system-user', columnsStateType: 'local' },
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
            @click.prevent="handleEdit()"
            v-perms:has="['system:user:add']"
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
            v-perms:has="['system:user:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleImport()"
            v-perms:has="['system:user:import']"
          >
            <template #icon>
              <ImportOutlined />
            </template>
            导入
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:user:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dept_id'">
          {{ record.dept?.dept_name }}
        </template>
        <template v-if="column.key === 'user_status'">
          <a-switch
            v-if="
              dict.sysNormalDisable.length > 0 &&
              !record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)
            "
            v-perms:has="['system:user:edit']"
            v-model:checked="record.user_status"
            checked-value="1"
            :checked-children="dict.sysNormalDisable[1].label"
            un-checked-value="0"
            :un-checked-children="dict.sysNormalDisable[0].label"
            size="small"
            @change="handleStatusChange(record)"
          />
          <DictTag
            v-else
            :options="dict.sysNormalDisable"
            :value="record.user_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:user:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleEdit(record.id)"
                v-perms:has="['system:user:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:user:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>重置密码</template>
              <a-button
                type="link"
                @click.prevent="handleResetPassword(record)"
                v-perms:has="['system:user:passwd']"
              >
                <template #icon>
                  <SecurityScanOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>解锁</template>
              <a-button
                type="link"
                @click.prevent="handleUnlock(record.user_name)"
                v-perms:has="['system:user:unlock']"
              >
                <template #icon>
                  <UnlockOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <UserFormModal
      ref="userFormModal"
      :dept-tree-data="deptTreeData"
      @success="handleFormSuccess"
    />
    <UserResetPasswordModal ref="resetPasswordModal" />
    <UserImportModal ref="importModal" @imported="handleImported" />
  </PageContainer>
</template>
