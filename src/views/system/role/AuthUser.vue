<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, toRaw, computed } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'antdv-next';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import AuthUserSelectModal from './components/AuthUserSelectModal.vue';
import { authUserList, authUserChecked } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date';
import { useTabsView } from '@/hooks/useTabsView';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const { closeTab } = useTabsView();
const route = useRoute();
const router = useRouter();
/** 获取地址栏参数 */
const role_id = route.params && (route.params.roleId as string);
const role_name = route.query && (route.query.role_name as string);

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
  onSearch,
  onReset,
  onTableChange,
  reload,
  rowSelection,
  selectedRowKeys,
  removeSelectedRowKeys,
} = useProTable({
  queryFn: authUserList,
  params: () => ({ role_id, auth: true }),
  defaultPageSize: 20,
  rowKey: 'id',
});

const { confirmAction, executeAction } = useModalAction();

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '用户编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'user_name', align: 'left', width: 150 },
  { title: '手机号码', dataIndex: 'user_phone', align: 'left', width: 150 },
  { title: '电子邮箱', dataIndex: 'user_email', align: 'left', width: 200 },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    key: 'user_status',
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
  { title: '操作', key: 'operation', align: 'left', fixed: 'right' },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '登录账号', dataIndex: 'user_name' },
  { title: '手机号码', dataIndex: 'user_phone', fieldProps: { maxlength: 11 } },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

/** 选择用户弹窗状态 */
const selectUserVisible = ref(false);

/** 打开选择用户弹窗 */
function handleSelectUser() {
  selectUserVisible.value = true;
}

/** 授权用户确认回调 */
async function handleAuthUserConfirm(userIds: (string | number)[]) {
  if (userIds.length <= 0) {
    message.error({ content: '请选择要分配的用户', duration: 3 });
    return;
  }
  const params = {
    auth: true,
    user_ids: userIds.map((v: any) => parseInt(v)),
    role_id: parseInt(role_id),
  };
  await executeAction({
    action: () => authUserChecked(params),
    successText: '授权用户添加成功',
    onSuccess() {
      selectUserVisible.value = false;
      current.value = 1;
      reload();
    },
  });
}

/** 取消授权 */
function handleRevokeAuth(user_id: string | number) {
  let userIds: number[] = [];
  if (user_id === '0' || user_id === 0) {
    userIds = selectedRowKeys.value.map((v: any) => parseInt(v));
  } else {
    userIds = [Number(user_id)];
  }
  confirmAction({
    content: `确认取消用户编号为 【${userIds.map((v: any) => v).join(',')}】 的数据项授权?`,
    action: () => {
      return authUserChecked({
        auth: false,
        user_ids: userIds,
        role_id: parseInt(role_id),
      });
    },
    successText: '取消授权成功',
    onSuccess() {
      removeSelectedRowKeys(userIds);
      reload();
    },
  });
}

/** 关闭跳转 */
function handleClose() {
  const to = closeTab(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}
</script>

<template>
  <PageContainer>
    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      :scroll="tableScroll"
      @change="onTableChange"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: {
          columnsStateKey: 'system-role-auth-user',
          columnsStateType: 'local',
        },
        onReload: reload,
      }"
    >
      <template #toolBarRender>
        <a-space
          :size="8"
          align="center"
          :style="{ flexWrap: 'wrap', marginBottom: '8px' }"
        >
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon>
              <CloseOutlined />
            </template>
            关闭
          </a-button>
          <a-button
            type="primary"
            @click.prevent="handleSelectUser()"
            v-perms:has="['system:role:auth']"
          >
            <template #icon>
              <UsergroupAddOutlined />
            </template>
            分配用户
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleRevokeAuth('0')"
            v-perms:has="['system:role:auth']"
          >
            <template #icon>
              <UsergroupDeleteOutlined />
            </template>
            批量取消授权
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.user_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>取消授权</template>
              <a-button
                type="link"
                @click.prevent="handleRevokeAuth(record.id)"
                v-perms:has="['system:role:auth']"
              >
                <template #icon>
                  <UserDeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <AuthUserSelectModal
      :role-id="role_id"
      v-model:open="selectUserVisible"
      @ok="handleAuthUserConfirm"
    />
  </PageContainer>
</template>
