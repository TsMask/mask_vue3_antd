<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { PageContainer } from 'antdv-pro-layout';
import OnlineUserTable from './components/OnlineUserTable.vue';
import { forceLogout, listOnline } from '@/api/monitor/online';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable } from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const { confirmAction } = useModalAction();

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

/** 强退指定会话，使对应 Token 立即失效 */
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

    <OnlineUserTable
      :loading="loading"
      :data-source="dataSource"
      :pagination="pagination"
      @search="onSearch"
      @reset="onReset"
      @change="onTableChange"
      @reload="reload"
      @force-logout="handleForceLogout"
    />
  </PageContainer>
</template>
