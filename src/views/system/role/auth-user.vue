<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { reactive, onMounted, toRaw } from 'vue';
import { PageContainer } from '@ant-design-vue/pro-layout';
import { message, Modal } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import AuthUserSelect from './components/auth-user-select.vue';
import { authUserAllocatedList, authUserChecked } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import useTabsStore from '@/store/modules/tabs';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const tabsStore = useTabsStore();
const { getDict } = useDictStore();
const route = useRoute();
const router = useRouter();

// 获取地址栏参数
const roleId = route.params && (route.params.roleId as string);
const roleName = route.query && (route.query.roleName as string);

/**字典数据 */
let dict: {
  /**状态 */
  sysNormalDisable: DictType[];
} = reactive({
  sysNormalDisable: [],
});

/**查询参数 */
let queryParams = reactive({
  /**登录账号 */
  userName: '',
  /**手机号码 */
  phonenumber: '',
  /**用户状态 */
  status: undefined,
  /**角色ID */
  roleId: roleId,
  /**是否已分配 */
  allocated: true,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  queryParams = Object.assign(queryParams, {
    userName: '',
    phonenumber: '',
    status: undefined,
    pageNum: 1,
    pageSize: 20,
  });
  tablePagination.current = 1;
  tablePagination.pageSize = 20;
  fnGetList();
}

/**表格状态类型 */
type TabeStateType = {
  /**加载等待 */
  loading: boolean;
  /**紧凑型 */
  size: SizeType;
  /**斑马纹 */
  striped: boolean;
  /**搜索栏 */
  seached: boolean;
  /**记录数据 */
  data: object[];
  /**勾选记录 */
  selectedRowKeys: (string | number)[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: true,
  data: [],
  selectedRowKeys: [],
});

/**表格字段列 */
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
    width: 100,
  },
  {
    title: '用户昵称',
    dataIndex: 'nickName',
    align: 'left',
    width: 100,
  },
  {
    title: '手机号码',
    dataIndex: 'phonenumber',
    align: 'left',
    width: 120,
  },
  {
    title: '电子邮箱',
    dataIndex: 'email',
    align: 'left',
    width: 120,
  },
  {
    title: '用户状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'center',
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

/**表格分页器参数 */
let tablePagination = reactive({
  /**当前页数 */
  current: 1,
  /**每页条数 */
  pageSize: 20,
  /**默认的每页条数 */
  defaultPageSize: 20,
  /**指定每页可以显示多少条 */
  pageSizeOptions: ['10', '20', '50', '100'],
  /**只有一页时是否隐藏分页器 */
  hideOnSinglePage: false,
  /**是否可以快速跳转至某页 */
  showQuickJumper: true,
  /**是否可以改变 pageSize */
  showSizeChanger: true,
  /**数据总数 */
  total: 0,
  showTotal: (total: number) => `总共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    tablePagination.current = page;
    tablePagination.pageSize = pageSize;
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fnGetList();
  },
});

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number): any {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**表格多选 */
function fnTableSelectedRowKeys(keys: (string | number)[]) {
  tableState.selectedRowKeys = keys;
}

/**对话框对象信息状态类型 */
type ModalStateType = {
  /**选择用户框是否显示 */
  visibleBySelectUser: boolean;
  /**标题 */
  title: string;
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleBySelectUser: false,
  title: '选择用户',
});

/**
 * 对话框弹出显示为 选择用户
 */
function fnModalVisibleBySelectUser() {
  modalState.visibleBySelectUser = true;
}

/**
 * 对话框弹出确认执行函数
 * 授权用户
 */
function fnModalOk(userIds: string[] | number[]) {
  if (userIds.length <= 0) {
    message.error(`请选择要分配的用户`, 2);
    return;
  }
  const key = 'authUserChecked';
  message.loading({ content: '请稍等...', key });
  authUserChecked({
    checked: true,
    userIds: userIds.join(','),
    roleId: roleId,
  }).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      modalState.visibleBySelectUser = false;
      message.success({
        content: `授权用户添加成功`,
        key,
        duration: 3,
      });
      fnGetList(1);
    } else {
      message.error({
        content: `${res.msg}`,
        key,
        duration: 3,
      });
    }
  });
}

/**
 * 取消授权
 * @param userId 用户编号ID
 */
function fnRecordDelete(userId: string | number) {
  if (userId === '0') {
    userId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认取消用户编号为 【${userId}】 的数据项授权?`,
    onOk() {
      const key = 'authUserChecked';
      message.loading({ content: '请稍等...', key });
      authUserChecked({ checked: false, userIds: userId, roleId: roleId }).then(
        res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `取消授权成功`,
              key,
              duration: 3,
            });
            fnGetList(1);
          } else {
            message.error({
              content: `${res.msg}`,
              key,
              duration: 3,
            });
          }
        }
      );
    },
  });
}

/**关闭跳转 */
function fnClose() {
  const to = tabsStore.tabClose(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}

/**查询角色已授权用户列表, pageNum初始页数 */
function fnGetList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  authUserAllocatedList(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.rows)) {
      // 取消勾选
      if (tableState.selectedRowKeys.length > 0) {
        tableState.selectedRowKeys = [];
      }
      tablePagination.total = res.total;
      tableState.data = res.rows;
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([getDict('sys_normal_disable')]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
    }
  });
  // 获取列表数据
  fnGetList();
});
</script>

<template>
  <PageContainer>
    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              <a-input
                :value="roleName"
                disabled
                placeholder="请输入角色名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                :maxlength="30"
                placeholder="请输入登录账号"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phonenumber">
              <a-input
                v-model:value="queryParams.phonenumber"
                allow-clear
                :maxlength="11"
                placeholder="请输入手机号码"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="用户状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择用户状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fnGetList(1)">
                  <template #icon><SearchOutlined /></template>
                  搜索</a-button
                >
                <a-button type="default" @click.prevent="fnQueryReset">
                  <template #icon><ClearOutlined /></template>
                  重置</a-button
                >
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
          <a-button type="default" @click.prevent="fnClose()">
            <template #icon><CloseOutlined /></template>
            关闭
          </a-button>
          <a-button
            type="primary"
            @click.prevent="fnModalVisibleBySelectUser()"
            v-perms:has="['system:role:add']"
          >
            <template #icon><UsergroupAddOutlined /></template>
            分配用户
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete('0')"
            v-perms:has="['system:role:remove']"
          >
            <template #icon><UsergroupDeleteOutlined /></template>
            批量取消授权
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip>
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="显"
              un-checked-children="隐"
              size="small"
            />
          </a-tooltip>
          <a-tooltip>
            <template #title>表格斑马纹</template>
            <a-switch
              v-model:checked="tableState.striped"
              checked-children="开"
              un-checked-children="关"
              size="small"
            />
          </a-tooltip>
          <a-tooltip>
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fnGetList()">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon><ColumnHeightOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu
                  :selected-keys="[tableState.size as string]"
                  @click="fnTableSize"
                >
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
      <a-table
        class="table"
        row-key="userId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        :pagination="tablePagination"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: fnTableSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.status" />
          </template>
          <template v-if="column.key === 'userId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>取消授权</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.userId)"
                  v-perms:has="['system:role:remove']"
                >
                  <template #icon><UserDeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 分配用户选择框 -->
    <AuthUserSelect
      :role-id="roleId"
      :title="modalState.title"
      v-model:visible="modalState.visibleBySelectUser"
      @ok="fnModalOk"
    />
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
