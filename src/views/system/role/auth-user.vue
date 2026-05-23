<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import AuthUserSelect from './components/auth-user-select.vue';
import { authUserList, authUserChecked } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import useTabsStore from '@/store/modules/tabs';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useMessageAction } from '@/hooks/useMessageAction';
const tabsStore = useTabsStore();
const route = useRoute();
const router = useRouter();

// 获取地址栏参数
const roleId = route.params && (route.params.roleId as string);
const roleName = route.query && (route.query.roleName as string);

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysNormalDisable: 'sys_normal_disable',
});

/** 通用操作反馈：带loading的异步操作、二次确认 */
const { withLoading, confirmAndRun } = useMessageAction();

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    userName: '',
    phone: '',
    statusFlag: undefined,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/** 分页管理：current/pageSize/total/onChange + fixPageAfterDelete */
const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

/** 表格UI状态：loading/size/striped/seached/data/selectedRowKeys */
const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } =
  useTableUI({ defaultSize: 'middle' });

/** 表格搜索栏默认展开 */
tableState.seached = true;

/** 表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '用户编号',
    dataIndex: 'userId',
    align: 'left',
    width: 100,
  },
  {
    title: '登录账号',
    dataIndex: 'userName',
    align: 'left',
    width: 150,
  },
  {
    title: '用户昵称',
    dataIndex: 'nickName',
    align: 'left',
    width: 150,
  },
  {
    title: '手机号码',
    dataIndex: 'phone',
    align: 'left',
    width: 150,
  },
  {
    title: '电子邮箱',
    dataIndex: 'email',
    align: 'left',
    width: 200,
  },
  {
    title: '用户状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
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
  {
    title: '操作',
    key: 'userId',
    align: 'left',
  },
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
  const res = await withLoading(
    authUserChecked({
      auth: true,
      userIds: userIds.map((v: any) => parseInt(v)),
      roleId: parseInt(roleId),
    }),
    { successText: '授权用户添加成功' },
  );
  if (res.code === RESULT_CODE_SUCCESS) {
    selectUserVisible.value = false;
    fetchList(1);
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
    onOk: () =>
      authUserChecked({
        auth: false,
        userIds: userIds,
        roleId: parseInt(roleId),
      }),
    successText: '取消授权成功',
    onSuccess: () => fetchList(1),
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

/** 查询角色已授权用户列表, pageNum初始页数 */
function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  authUserList(toRaw(queryParams)).then(res => {
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
  <PageContainer>
    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <!-- 表格搜索栏 -->
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
                <a-button type="primary" @click.prevent="fetchList(1)">
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
      <!-- 插槽-卡片左侧 -->
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
      <a-table class="table" row-key="userId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :pagination="pagination" :row-selection="{
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

    <!-- 分配用户选择框 -->
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