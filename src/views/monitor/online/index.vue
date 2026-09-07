<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import { forceLogout, listOnline } from '@/api/monitor/online';
import { parseDateToStr } from '@/utils/date-utils';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable, useProTableScroll } from '@/hooks/useProTable';

const { confirmAction } = useModalAction();

const route = useRoute();
/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

const {
  dataSource,
  loading,
  pagination,
  onSearch,
  onReset,
  onTableChange,
  reload,
} = useProTable({
  queryFn: listOnline,
  defaultPageSize: 20,
});

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  {
    title: '序号',
    valueType: 'index',
    width: 50,
    align: 'left',
    fixed: 'left',
  },
  {
    title: '登录账号',
    dataIndex: 'user_name',
    align: 'left',
    width: 150,
    sorter: true,
    fixed: 'left',
  },
  { title: '角色', dataIndex: 'role_keys', align: 'left', width: 120 },
  { title: '登录IP', dataIndex: 'login_ip', align: 'left', width: 120 },
  { title: '登录地点', dataIndex: 'login_location', align: 'left', width: 120 },
  { title: '操作系统', dataIndex: 'login_os', align: 'left', width: 120 },
  { title: '浏览器', dataIndex: 'login_browser', align: 'left', width: 200 },
  {
    title: '登录时间',
    dataIndex: 'login_time',
    align: 'left',
    width: 150,
    sorter: true,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '会话编号',
    dataIndex: 'session_id',
    align: 'left',
    width: 260,
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 90,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '登录账号', dataIndex: 'user_name', fieldProps: { maxlength: 30 } },
  { title: '登录IP', dataIndex: 'login_ip', fieldProps: { maxlength: 128 } },
]);

/** 强退按钮操作 */
function handleForceLogout(row: Record<string, string>) {
  confirmAction({
    content: `确认强退登录账号为 ${row.user_name} 的用户?`,
    action: () => forceLogout(row.session_id),
    successText: `已强退用户 ${row.user_name}`,
    onSuccess() {
      reload();
    },
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

    <ProTable
      row-key="session_id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="tableScroll"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: {
          columnsStateKey: 'monitor-online',
          columnsStateType: 'local',
        },
        onReload: reload,
      }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'role_keys'">
          <a-space :size="4" :wrap="true">
            <a-tag v-for="role in record.role_keys ?? []" :key="role">
              {{ role }}
            </a-tag>
            <span v-if="!record.role_keys?.length">-</span>
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'login_time'">
          <span>{{
            +record.login_time > 0 ? parseDateToStr(+record.login_time) : ''
          }}</span>
        </template>
        <template v-if="column.dataIndex === 'session_id'">
          <a-typography-text
            class="identifier-text"
            :content="record.session_id"
            :copyable="{ text: record.session_id }"
            :ellipsis="true"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-button
            type="link"
            danger
            @click.prevent="handleForceLogout(record)"
            v-perms:has="['monitor:online:logout']"
          >
            <template #icon>
              <LogoutOutlined />
            </template>
            强退
          </a-button>
        </template>
      </template>
    </ProTable>
  </PageContainer>
</template>

<style scoped>
.identifier-text {
  max-width: 100%;
}
</style>
