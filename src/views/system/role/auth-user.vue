<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, toRaw, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import AuthUserSelect from './components/auth-user-select.vue';
import { authUserList, authUserChecked } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import { isSuccess } from '@/plugins/http-fetch';
import useTabsStore from '@/store/modules/tabs';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { useMutationAction, confirmAndRun } from '@/hooks/useMutationAction';

const tabsStore = useTabsStore();
const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();

/** 获取地址栏参数 */
const roleId = route.params && (route.params.roleId as string);
const roleName = route.query && (route.query.roleName as string);

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysNormalDisable: 'sys_normal_disable',
});

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    userName: '',
    phone: '',
    statusFlag: undefined as string | undefined,
    roleId: roleId,
    auth: true,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
  },
);

/** 分页管理 */
const { pagination, resetPage, fixPage } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
  },
});

/** 列表数据查询（vue-query 自动管理缓存、loading、刷新） */
const { listData, total, isFetching } = useListQuery({
  queryKey: computed(() => ['authUserList', { ...toRaw(queryParams) }]),
  queryFn: () => authUserList(toRaw(queryParams)),
});

/** 列表刷新后清空表格选中行 */
watch(isFetching, (newVal, oldVal) => {
  if (oldVal && !newVal) clearSelection();
});

/** 表格UI状态 */
const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } =
  useTableUI({ defaultSize: 'middle' });

/** 表格搜索栏默认展开 */
tableState.seached = true;

/** 授权用户 mutation */
const { mutateAsync: authMutateAsync } = useMutationAction({
  mutationFn: (data: Record<string, any>) => authUserChecked(data),
  invalidateKeys: [['authUserList']],
});

/** 表格字段列 */
let tableColumns: ColumnsType = [
  { title: '用户编号', dataIndex: 'userId', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'userName', align: 'left', width: 150 },
  { title: '用户昵称', dataIndex: 'nickName', align: 'left', width: 150 },
  { title: '手机号码', dataIndex: 'phone', align: 'left', width: 150 },
  { title: '电子邮箱', dataIndex: 'email', align: 'left', width: 200 },
  { title: '用户状态', dataIndex: 'statusFlag', key: 'statusFlag', align: 'left', width: 100 },
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
  { title: '操作', key: 'userId', align: 'left' },
];

/** 选择用户弹窗状态 */
const selectUserVisible = ref(false);
const selectUserTitle = '选择用户';

/** 打开选择用户弹窗 */
function handleOpenSelectUser() {
  selectUserVisible.value = true;
}

/** 授权用户确认回调 */
async function handleAuthUserOk(userIds: string[] | number[]) {
  if (userIds.length <= 0) {
    message.error({ content: '请选择要分配的用户', duration: 3 });
    return;
  }
  try {
    await authMutateAsync({
      auth: true,
      userIds: userIds.map((v: any) => parseInt(v)),
      roleId: parseInt(roleId),
    });
    message.success({ content: '授权用户添加成功', duration: 3 });
    selectUserVisible.value = false;
    queryParams.pageNum = 1;
  } catch {
    // 错误已由 useMutationAction 统一处理
  }
}

/** 取消授权 */
function handleRevokeAuth(userId: string | number) {
  let userIds: number[] = [];
  if (userId === '0' || userId === 0) {
    userIds = tableState.selectedRowKeys.map((v: any) => parseInt(v));
  } else {
    userIds = [Number(userId)];
  }
  confirmAndRun({
    content: `确认取消用户编号为 【${userId}】 的数据项授权?`,
    action: () =>
      authUserChecked({
        auth: false,
        userIds: userIds,
        roleId: parseInt(roleId),
      }),
    variables: undefined,
    successText: '取消授权成功',
    invalidateKeys: [['authUserList']],
  });
}

/** 关闭跳转 */
function handleClose() {
  const to = tabsStore.tabClose(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}
</script>

<template>
  <PageContainer>
    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              <a-input :value="roleName" disabled placeholder="请输入角色名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input v-model:value="queryParams.userName" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phone">
              <a-input v-model:value="queryParams.phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择用户状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="queryParams.pageNum = 1">
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
      <template #title>
        <a-space :size="8" align="center">
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon>
              <CloseOutlined />
            </template>
            关闭
          </a-button>
          <a-button type="primary" @click.prevent="handleOpenSelectUser()" v-perms:has="['system:role:add']">
            <template #icon>
              <UsergroupAddOutlined />
            </template>
            分配用户
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleRevokeAuth('0')" v-perms:has="['system:role:remove']">
            <template #icon>
              <UsergroupDeleteOutlined />
            </template>
            批量取消授权
          </a-button>
        </a-space>
      </template>

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
            <a-button type="text" @click.prevent="queryClient.invalidateQueries({ queryKey: ['authUserList'] })">
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

      <a-table class="table" row-key="userId" :columns="tableColumns" :loading="isFetching"
        :data-source="listData" :size="tableState.size" :row-class-name="rowClassName" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :pagination="{ ...pagination, total }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysNormalDisable" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'userId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>取消授权</template>
                <a-button type="link" @click.prevent="handleRevokeAuth(record.userId)"
                  v-perms:has="['system:role:remove']">
                  <template #icon>
                    <UserDeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <AuthUserSelect :role-id="roleId" :title="selectUserTitle" v-model:open="selectUserVisible"
      @ok="handleAuthUserOk" />
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
