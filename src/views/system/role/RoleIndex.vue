<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import RoleFormModal from './components/RoleFormModal.vue';
import RoleDataScopeModal from './components/RoleDataScopeModal.vue';
import { exportRole, changeStatus, delRole, listRole } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date';
import { hasPermissions } from '@/utils/authAccess';
import { saveAs } from 'file-saver';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const title = ref<string>(route.meta.title ?? '标题');

/** 角色状态字典同时驱动查询、表格展示和开关文案。 */
const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
  },
});

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

const { confirmAction } = useModalAction();
const roleFormModal = ref<InstanceType<typeof RoleFormModal> | null>(null);
const dataScopeModal = ref<InstanceType<typeof RoleDataScopeModal> | null>(
  null
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
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 220,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

/** 查询字段 */
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

function handleView(role_id: string | number) {
  roleFormModal.value?.openView(role_id);
}

function handleEdit(role_id?: string | number) {
  roleFormModal.value?.openEdit(role_id);
}

/** 表单保存成功后回到第一页，避免停留在已失效的分页位置 */
function handleFormSuccess() {
  current.value = 1;
  reload();
}

function handleDataScope(role_id: string | number) {
  dataScopeModal.value?.open(role_id);
}

/** 跳转角色授权用户页，并携带角色名用于页面提示 */
function handleAuthUser(row: Record<string, string>) {
  router.push({
    name: 'AuthUser',
    params: { roleId: String(row.id) },
    query: { role_name: row.role_name },
  });
}

/** 开关已先变更，请求取消时需要把行状态回滚为原值 */
function handleStatusChange(row: Record<string, string>) {
  const text = row.role_status === '1' ? '启用' : '停用';
  confirmAction({
    content: `确定要${text} ${row.role_name} 角色吗?`,
    action: () => changeStatus(row.id, row.role_status),
    successText: `${row.role_name} ${text}成功`,
    onSuccess() {
      reload();
    },
    onCancel() {
      row.role_status = row.role_status === '1' ? '0' : '1';
    },
  });
}

/** 支持行内删除和批量删除，默认 0 表示使用当前选中行 */
function handleDelete(role_id: string = '0') {
  const id = role_id === '0' ? selectedRowKeys.value.join(',') : role_id;
  confirmAction({
    content: `确认删除角色编号为 【${id}】 的数据项?`,
    action: () => delRole(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
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
            @click.prevent="handleEdit()"
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
            :checked-children="dict.sysNormalDisable[1].label"
            un-checked-value="0"
            :un-checked-children="dict.sysNormalDisable[0].label"
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
                @click.prevent="handleEdit(record.id)"
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
                @click.prevent="handleDataScope(record.id)"
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

    <RoleFormModal ref="roleFormModal" @success="handleFormSuccess" />
    <RoleDataScopeModal ref="dataScopeModal" />
  </PageContainer>
</template>
