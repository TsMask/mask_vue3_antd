<script setup lang="ts">
import {
  LogoutOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import { forceLogout, listOnline } from '@/api/monitor/online';
import { parseDateToStr } from '@/utils/DateUtils';
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**查询参数 */
let queryParams = reactive({
  /**登录主机 */
  ipaddr: '',
  /**用户名称 */
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
    width: '50px',
    align: 'center',
    customRender(opt) {
      const idxNum = (tablePagination.current - 1) * tablePagination.pageSize;
      return idxNum + opt.index + 1;
    },
  },
  {
    title: '会话编号',
    dataIndex: 'tokenId',
    align: 'center',
  },
  {
    title: '用户名称',
    dataIndex: 'userName',
    align: 'center',
  },
  {
    title: '所属部门',
    dataIndex: 'deptName',
    align: 'center',
  },
  {
    title: '登录主机',
    dataIndex: 'ipaddr',
    align: 'center',
  },
  {
    title: '登录地点',
    dataIndex: 'loginLocation',
    align: 'center',
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    align: 'center',
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    align: 'center',
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    align: 'center',
    customRender(opt) {
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'tokenId',
    align: 'center',
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
function fnTableStriped(_record: unknown, index: number) {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**查询参数重置 */
function fnQueryReset() {
  queryParams.ipaddr = '';
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
    if (res.code === 200 && Array.isArray(res.rows)) {
      tableState.data = res.rows;
    }
    tableState.loading = false;
  });
}

/** 强退按钮操作 */
function fnForceLogout(row: Record<string, string>) {
  Modal.confirm({
    title: '提示',
    content: `确认强退用户名称为 ${row.userName} 的用户?`,
    onOk() {
      const key = 'forceLogout';
      message.loading({ content: '请稍等...', key });
      forceLogout(row.tokenId).finally(() => {
        message.error({
          content: `已强退用户 ${row.userName}`,
          key,
          duration: 2,
        });
      });
      fnGetList();
    },
  });
}

onMounted(() => {
  fnGetList();
});
</script>

<template>
  <page-container :title="title">
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
            <a-form-item label="用户名称" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                placeholder="请输入用户名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录主机" name="ipaddr">
              <a-input
                v-model:value="queryParams.ipaddr"
                allow-clear
                placeholder="请输入登录主机"
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
          <a-tooltip>
            <template #title>密度</template>
            <a-dropdown trigger="click">
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
        :scroll="{ x: true }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tokenId'">
            <a-button type="link" @click.prevent="fnForceLogout(record)">
              <template #icon><LogoutOutlined /></template>
              强退
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </page-container>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
