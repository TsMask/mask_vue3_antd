<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { PageContainer } from 'antdv-pro-layout';
import type { ColumnsType } from 'ant-design-vue/es/table';
import { forceLogout, listOnline } from '@/api/monitor/online';
import { parseDateToStr } from '@/utils/date-utils';
import { useTableUI } from '@/hooks/useTableUI';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { confirmAndRun } from '@/hooks/useMutationAction';
import { useQueryClient } from '@tanstack/vue-query';
import { toRaw } from 'vue';

const route = useRoute();
const queryClient = useQueryClient();

/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams({
  loginIp: '',
  userName: '',
});

/** 表格UI状态：size/striped/searched */
const { tableState, setTableSize, rowClassName } = useTableUI();

/** 列表数据查询（vue-query 自动管理缓存、loading、刷新） */
const { listData, isFetching } = useListQuery({
  queryKey: computed(() => ['onlineList', { ...toRaw(queryParams) }]),
  queryFn: () => listOnline(toRaw(queryParams)),
});

/** 表格字段列 */
const tableColumns: ColumnsType = [
  {
    title: '序号',
    dataIndex: 'num',
    width: 50,
    align: 'left',
    customRender(opt) {
      return (opt.index as number) + 1;
    },
  },
  { title: '登录账号', dataIndex: 'userName', align: 'left', width: 150 },
  { title: '所属部门', dataIndex: 'deptName', align: 'left', width: 150 },
  { title: '登录IP', dataIndex: 'loginIp', align: 'left', width: 120 },
  { title: '登录地点', dataIndex: 'loginLocation', align: 'left', width: 120 },
  { title: '操作系统', dataIndex: 'os', align: 'left', width: 120 },
  { title: '浏览器', dataIndex: 'browser', align: 'left', width: 200 },
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
  { title: '会话编号', dataIndex: 'tokenId', align: 'left', width: 250 },
  { title: '操作', key: 'tokenId', align: 'left' },
];

/** 强退按钮操作 */
function handleForceLogout(row: Record<string, string>) {
  confirmAndRun({
    content: `确认强退登录账号为 ${row.userName} 的用户?`,
    action: () => forceLogout(row.tokenId),
    variables: undefined,
    successText: `已强退用户 ${row.userName}`,
    invalidateKeys: [['onlineList']],
  });
}
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

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input v-model:value="queryParams.userName" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录IP" name="loginIp">
              <a-input v-model:value="queryParams.loginIp" allow-clear :maxlength="128" placeholder="请输入登录IP"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="24" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="resetQuery">
                  <template #icon><SearchOutlined /></template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="resetQuery">
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
      <template #title>{{ title }}</template>

      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip>
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.seached" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip>
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip>
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="queryClient.invalidateQueries({ queryKey: ['onlineList'] })">
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

      <a-table class="table" row-key="tokenId" :columns="tableColumns" :loading="isFetching"
        :data-source="listData" :size="tableState.size" :row-class-name="rowClassName"
        :pagination="false"
        :scroll="{ x: tableColumns.length * 150, scrollToFirstRowOnChange: true }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tokenId'">
            <a-button type="link" danger @click.prevent="handleForceLogout(record)"
              v-perms:has="['monitor:online:forceLogout']">
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