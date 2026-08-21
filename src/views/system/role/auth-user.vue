<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, toRaw, watch } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import AuthUserSelect from './components/auth-user-select.vue';
import { authUserList, authUserChecked } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import useTabsStore from '@/store/modules/tabs';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { useAction, confirmAction } from '@/hooks/useAction';

const tabsStore = useTabsStore();
const route = useRoute();
const router = useRouter();
/** 获取地址栏参数 */
const role_id = route.params && (route.params.roleId as string);
const role_name = route.query && (route.query.role_name as string);

/** 字典数据初始化 */
const { dict } = useDictSetup({ keyMap: { sysNormalDisable: 'sys_normal_disable', } });

/** 查询参数 */
const { queryParams, handleQuery, resetQuery } = useQueryParams(
  {
    user_name: '',
    user_phone: '',
    user_status: undefined as string | undefined,
    role_id: role_id,
    auth: true,
    page_num: 1,
    page_size: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/** 分页管理 */
const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, page_size) => {
    queryParams.page_num = page;
    queryParams.page_size = page_size;
    fetchList()
  },
});

/** 列表数据查询 */
const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => authUserList(toRaw(queryParams)),
});

/** 列表刷新后清空表格选中行 */
watch(loading, (newVal, oldVal) => {
  if (oldVal && !newVal) clearSelection();
});

/** 表格UI状态 */
const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } =
  useTableUI({ defaultSize: 'middle' });

/** 表格搜索栏默认展开 */
tableState.searched = true;

/** 授权用户 mutation */
const { execute: authExecute } = useAction({
  action: (data: Record<string, any>) => authUserChecked(data),
});

/** 表格字段列 */
let tableColumns: ColumnsType = [
  { title: '用户编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'user_name', align: 'left', width: 150 },
  { title: '用户昵称', dataIndex: 'user_nick', align: 'left', width: 150 },
  { title: '手机号码', dataIndex: 'user_phone', align: 'left', width: 150 },
  { title: '电子邮箱', dataIndex: 'user_email', align: 'left', width: 200 },
  { title: '用户状态', dataIndex: 'user_status', key: 'user_status', align: 'left', width: 100 },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  { title: '操作', key: 'id', align: 'left' },
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
    await authExecute({
      auth: true,
      user_ids: userIds.map((v: any) => parseInt(v)),
      role_id: parseInt(role_id),
    });
    message.success({ content: '授权用户添加成功', duration: 3 });
    selectUserVisible.value = false;
    queryParams.page_num = 1;
  } catch {
    // 错误已由 useAction 统一处理
  }
}

/** 取消授权 */
function handleRevokeAuth(user_id: string | number) {
  let userIds: number[] = [];
  if (user_id === '0' || user_id === 0) {
    userIds = tableState.selectedRowKeys.map((v: any) => parseInt(v));
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
    variables: undefined,
    successText: '取消授权成功',
    onSuccess() {
      if (!clampPage(userIds.length)) fetchList();
    },
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
    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="角色名称" name="role_name">
              <a-input :value="role_name" disabled placeholder="请输入角色名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="user_name">
              <a-input v-model:value="queryParams.user_name" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="user_phone">
              <a-input v-model:value="queryParams.user_phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="用户状态" name="user_status">
              <a-select v-model:value="queryParams.user_status" allow-clear placeholder="请选择用户状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="handleQuery">
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
            <a-switch v-model:checked="tableState.searched" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList">
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

      <a-table class="antdv-table" row-key="id" :columns="tableColumns" :loading="loading" :data-source="listData"
        :size="tableState.size" :row-class-name="rowClassName" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :pagination="{ ...pagination }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user_status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.user_status" />
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>取消授权</template>
                <a-button type="link" @click.prevent="handleRevokeAuth(record.id)"
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

    <AuthUserSelect :role_id="role_id" :title="selectUserTitle" v-model:open="selectUserVisible"
      @ok="handleAuthUserOk" />
  </PageContainer>
</template>

<style lang="less" scoped>
.antdv-table :deep(.antdv-striped) td {
  background-color: #fafafa;
}

.antdv-table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
