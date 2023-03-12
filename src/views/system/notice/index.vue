<template>
  <page-container :title="route.meta.title">
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

    <div>
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
              <a-form-item label="登录地点" name="ipaddr">
                <a-input
                  v-model:value="queryParams.ipaddr"
                  allow-clear
                  placeholder="请输入登录地点"
                ></a-input> </a-form-item
            ></a-col>
            <a-col :span="12">
              <a-form-item>
                <a-space :size="8">
                  <a-button type="primary">
                    <template #icon><SearchOutlined /></template>
                    搜 索</a-button
                  >
                  <a-button type="default">
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
            <a-space :size="8">
              <a-button type="primary">
                <template #icon><SearchOutlined /></template>
                新 建</a-button
              >
              <a-button type="default">
                <template #icon><ReloadOutlined /></template>
                重 置</a-button
              >
            </a-space>
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
                <a-button type="text">
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
          :row-class-name="
            (_record, index) =>
              tableState.striped && index % 2 === 1
                ? 'table-striped'
                : undefined
          "
          :pagination="{
            pageSizeOptions: ['10', '20', '30', '40'],
            defaultPageSize: queryParams.pageSize,
            current: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            hideOnSinglePage: true,
            showQuickJumper: true,
            showSizeChanger: true,
            total: tableState.total,
            showTotal: total => `总共 ${total} 条`,
            onChange: fnPage,
          }"
        />
      </a-card>
    </div>
  </page-container>
</template>

<script setup lang="ts">
import { forceLogout, list } from '@/api/monitor/online';

import { message, TablePaginationConfig } from 'ant-design-vue';
import {
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  LikeOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref } from 'vue';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { SizeType } from 'ant-design-vue/lib/config-provider';
const route = useRoute();

function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

const tableColumns = [
  {
    title: '序号',
    dataIndex: 'name',
  },
  {
    title: '会话编号',
    dataIndex: 'tokenId',
  },
  {
    title: '用户名称',
    dataIndex: 'userName',
  },
  {
    title: '所属部门',
    dataIndex: 'deptName',
  },
  {
    title: '主机',
    dataIndex: 'ipaddr',
  },
  {
    title: '登录地点',
    dataIndex: 'loginLocation',
  },
  {
    title: '操作系统',
    dataIndex: 'os',
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
  },
  {
    title: '操作',
    dataIndex: 'loginTime',
  },
];

type TabeStateType = {
  /**加载等待 */
  loading: boolean;
  /**紧凑型 */
  size: SizeType;
  /**斑马纹 */
  striped: boolean;
  /**记录数据 */
  data: object[];
  /**总记录数 */
  total: number;
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  data: [],
  total: 0,
  rows: [],
});

/**查询参数 */
let queryParams = reactive({
  /**登录地点 */
  ipaddr: '',
  /**用户名称 */
  userName: '',
  /**页数 */
  pageNum: 1,
  /**单页记录数 */
  pageSize: 1,
});

/** 搜索按钮操作 */
function fnPage(page: number, pageSize: number) {
  queryParams.pageNum = page;
  queryParams.pageSize = pageSize;
  getList();
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams = reactive({
    ipaddr: '',
    userName: '',
    pageNum: 1,
    pageSize: 20,
  });
  handleQuery();
}

/** 强退按钮操作 */
function handleForceLogout(row: Record<string, string>) {
  forceLogout(row.tokenId);
}

/** 查询登录日志列表 */
async function getList() {
  tableState.loading = true;
  const res = await list(queryParams);
  tableState.data = res.rows;
  // tableState.data = res.rows.slice(
  //   (queryParams.pageNum - 1) * queryParams.pageSize,
  //   queryParams.pageNum * queryParams.pageSize
  // );
  tableState.loading = false;
}

getList();
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
  // &-left{
  //   display: flex;
  // justify-content: flex-start;
  // }
}

.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
