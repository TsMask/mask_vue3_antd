<template>
  <page-container :title="title">
    <template #content>
      <a-descriptions size="small" :column="2">
        <a-descriptions-item label="创建人">张三</a-descriptions-item>
        <a-descriptions-item label="联系方式">
          <a>421421</a>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">2017-01-10</a-descriptions-item>
        <a-descriptions-item label="更新时间">2017-10-10</a-descriptions-item>
        <a-descriptions-item label="备注"
          >中国浙江省杭州市西湖区古翠路</a-descriptions-item
        >
      </a-descriptions>
    </template>
    <template #extra>
      <a-button key="3">操作</a-button>
      <a-button key="2">操作</a-button>
      <a-button key="1" type="primary">主操作</a-button>
    </template>
    <template #extraContent>
      <a-space>
        <a-statistic title="Feedback" :value="1128">
          <template #prefix>
            <LikeOutlined />
          </template>
        </a-statistic>
        <a-statistic title="Unmerged" :value="93" suffix="/ 100" />
      </a-space>
    </template>

    <!-- 表格搜索栏 -->
    <div class="table-search">
      <a-form
        :model="queryParams"
        name="table-search"
        layout="horizontal"
        autocomplete="off"
      >
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="用户名称" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                placeholder="请输入用户名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="登录主机" name="ipaddr">
              <a-input
                v-model:value="queryParams.ipaddr"
                allow-clear
                placeholder="请输入登录主机"
              ></a-input> </a-form-item
          ></a-col>
          <a-col :span="12">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="getList">
                  <template #icon><SearchOutlined /></template>
                  搜 索</a-button
                >
                <a-button type="default" @click.prevent="fnResetQuery">
                  <template #icon><ClearOutlined /></template>
                  重 置</a-button
                >
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <a-card :body-style="{ padding: '0px' }">
      <!-- 表格功能栏 -->
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <h2>{{ title }}</h2>
        </div>
        <div class="table-toolbar-right">
          <a-space :size="8" align="center">
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
              <a-button type="text" @click.prevent="getList">
                <template #icon><ReloadOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip>
              <template #title>密度</template>
              <a-dropdown :trigger="['click']">
                <a-button type="text">
                  <template #icon><ColumnHeightOutlined /></template>
                </a-button>
                <template #overlay>
                  <a-menu @click="fnTableSize">
                    <a-menu-item key="default">默认</a-menu-item>
                    <a-menu-item key="middle">中等</a-menu-item>
                    <a-menu-item key="small">紧凑</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-tooltip>
          </a-space>
        </div>
      </div>
      <!-- 表格列表 -->
      <a-table
        class="table"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="tablePagination"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tokenId'">
            <a-button type="link" @click.prevent="fnForceLogout(record)">
              <template #icon><LogoutOutlined /></template>
              强 退</a-button
            >
          </template>
        </template>
      </a-table>
    </a-card>
  </page-container>
</template>

<script setup lang="ts">
import {
  LogoutOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  LikeOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { forceLogout, list } from '@/api/monitor/online';
import { message, Modal } from 'ant-design-vue';
import { ColumnsType } from 'ant-design-vue/lib/table';
import { parseDateToStr, YYYY_MM_DD_HH_MM_SS } from '@/utils/DateUtils';
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
  /**记录数据 */
  data: object[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  data: [],
});

/**表格字段列 */
const tableColumns: ColumnsType = [
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
      return parseDateToStr(opt.value, YYYY_MM_DD_HH_MM_SS);
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

/** 重置按钮操作 */
function fnResetQuery() {
  queryParams.ipaddr = '';
  queryParams.userName = '';
  tablePagination.current = 1;
  tablePagination.pageSize = 20;
  getList();
}

/** 查询在线用户列表 */
async function getList() {
  tableState.loading = true;
  const res = await list(queryParams);
  if (res.code === 200) {
    tableState.data = res.rows;
    tableState.loading = false;
  }
}

/** 强退按钮操作 */
function fnForceLogout(row: Record<string, string>) {
  // forceLogout(row.tokenId);
  Modal.confirm({
    title: '提示',
    content: `是否确认强退用户名称为 ${row.userName} 的用户?`,
    async onOk() {
      await forceLogout(row.tokenId);
      message.success(`已强退用户 ${row.userName}`, 1.5);
      await getList();
    },
    onCancel() {},
    class: 'test',
  });
}

onMounted(() => {
  fnResetQuery();
});
</script>

<style lang="less" scoped>
.table-search {
  margin-bottom: 16px;
  padding: 24px 24px 0;
  background: #fff;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  line-height: 64px;
}

.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
