<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { PageContainer } from 'antdv-pro-layout';
import { message, Modal } from 'ant-design-vue';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import type { ColumnsType } from 'ant-design-vue/es/table';
import { forceLogout, listOnline } from '@/api/monitor/online';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { parseDateToStr } from '@/utils/date-utils';
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**查询参数 */
let queryParams = reactive({
  /**登录主机 */
  loginIp: '',
  /**登录账号 */
  userName: '',
});

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
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: false,
  data: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '序号',
    dataIndex: 'num',
    width: 50,
    align: 'left',
    customRender(opt) {
      const idxNum = (tablePagination.current - 1) * tablePagination.pageSize;
      return idxNum + opt.index + 1;
    },
  },
  {
    title: '登录账号',
    dataIndex: 'userName',
    align: 'left',
    width: 150,
  },
  {
    title: '所属部门',
    dataIndex: 'deptName',
    align: 'left',
    width: 150,
  },
  {
    title: '登录IP',
    dataIndex: 'loginIp',
    align: 'left',
    width: 120,
  },
  {
    title: '登录地点',
    dataIndex: 'loginLocation',
    align: 'left',
    width: 120,
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    align: 'left',
    width: 120,
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    align: 'left',
    width: 200,
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '会话编号',
    dataIndex: 'tokenId',
    align: 'left',
    width: 250,
  },
  {
    title: '操作',
    key: 'tokenId',
    align: 'left',
  },
];

/**表格分页器参数 */
let tablePagination = {
  /**当前页数 */
  current: 1,
  /**每页条数 */
  pageSize: 20,
  /**默认的每页条数 */
  defaultPageSize: 20,
  /**指定每页可以显示多少条 */
  pageSizeOptions: ['10', '20', '50', '100'],
  /**只有一页时是否隐藏分页器 */
  hideOnSinglePage: true,
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
  },
};

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number): any {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**查询参数重置 */
function fnQueryReset() {
  queryParams.loginIp = '';
  queryParams.userName = '';
  tablePagination.current = 1;
  tablePagination.pageSize = 20;
  fnGetList();
}

/** 查询在线用户列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  listOnline(queryParams).then(res => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data.rows)) {
      tableState.data = res.data.rows;
    }
    tableState.loading = false;
  });
}

/** 强退按钮操作 */
function fnForceLogout(row: Record<string, string>) {
  Modal.confirm({
    title: '提示',
    content: `确认强退登录账号为 ${row.userName} 的用户?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      forceLogout(row.tokenId)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `已强退用户 ${row.userName}`,
              duration: 3,
            });
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
          fnGetList();
        });
    },
  });
}

onMounted(() => {
  fnGetList();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        登录用户
        <a-typography-text code>Token</a-typography-text>
        授权标识记录，存储在
        <a-typography-text code>Redis</a-typography-text>
        中，可撤销对用户的授权，拒绝用户请求并强制退出。
      </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
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
            <a-form-item label="登录IP" name="ipaddr">
              <a-input
                v-model:value="queryParams.loginIp"
                allow-clear
                :maxlength="128"
                placeholder="请输入登录IP"
              ></a-input> </a-form-item
          ></a-col>
          <a-col :lg="12" :md="24" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fnGetList">
                  <template #icon><SearchOutlined /></template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="fnQueryReset">
                  <template #icon><ClearOutlined /></template>
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
        {{ title }}
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
            <a-button type="text" @click.prevent="fnGetList">
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
        row-key="tokenId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="tablePagination"
        :scroll="{
          x: tableColumns.length * 150,
          scrollToFirstRowOnChange: true,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tokenId'">
            <a-button
              type="link"
              danger
              @click.prevent="fnForceLogout(record)"
              v-perms:has="['monitor:online:forceLogout']"
            >
              <template #icon><LogoutOutlined /></template>
              强退
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
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
