<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, toRaw, computed } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import NoticeFormModal from './components/NoticeFormModal.vue';
import { listNotice, delNotice } from '@/api/system/notice';
import { parseDateToStr } from '@/utils/date';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();

/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: {
    sysNoticeType: 'sys_notice_type',
    sysNoticeStatus: 'sys_notice_status',
  },
});

/** 列表数据查询 */
const {
  dataSource,
  loading,
  pagination,
  onSearch,
  onReset,
  onTableChange,
  reload,
  rowSelection,
  selectedRowKeys,
  removeSelectedRowKeys,
} = useProTable({
  queryFn: listNotice,
  defaultPageSize: 20,
  rowKey: 'id',
});

const noticeFormModal = ref<InstanceType<typeof NoticeFormModal> | null>(null);
const { confirmAction } = useModalAction();

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '公告编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '公告标题', dataIndex: 'notice_title', align: 'left', width: 300 },
  {
    title: '公告类型',
    dataIndex: 'notice_type',
    key: 'notice_type',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNoticeType),
  },
  {
    title: '状态',
    dataIndex: 'notice_status',
    key: 'notice_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNoticeStatus),
  },
  { title: '创建者', dataIndex: 'create_by', align: 'left', width: 100 },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 150,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '公告标题', dataIndex: 'notice_title' },
  {
    title: '公告类型',
    dataIndex: 'notice_type',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNoticeType),
  },
  {
    title: '状态',
    dataIndex: 'notice_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNoticeStatus),
  },
  { title: '创建者', dataIndex: 'create_by' },
]);

function handleView(id: string | number) {
  noticeFormModal.value?.openView(id);
}

function handleEdit(id?: string | number) {
  noticeFormModal.value?.openEdit(id);
}

function handleFormSuccess() {
  reload();
}

/** 删除公告（单条或批量） */
function handleDelete(id: string = '0') {
  if (id === '0') {
    id = selectedRowKeys.value.join(',');
  }
  confirmAction({
    content: `确认删除公告编号为【${id}】的数据项?`,
    action: () => delNotice(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        发布公告给内部用户的通知。
      </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      :scroll="tableScroll"
      @change="onTableChange"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: {
          columnsStateKey: 'system-notice',
          columnsStateType: 'local',
        },
        onReload: reload,
      }"
    >
      <template #toolBarRender>
        <a-space
          :size="8"
          align="center"
          :style="{ flexWrap: 'wrap', marginBottom: '8px' }"
        >
          <a-button
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['system:notice:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()"
            v-perms:has="['system:notice:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'notice_type'">
          <DictTag :options="dict.sysNoticeType" :value="record.notice_type" />
        </template>
        <template v-if="column.key === 'notice_status'">
          <DictTag
            :options="dict.sysNoticeStatus"
            :value="record.notice_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:notice:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleEdit(record.id)"
                v-perms:has="['system:notice:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:notice:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <NoticeFormModal ref="noticeFormModal" @success="handleFormSuccess" />
  </PageContainer>
</template>
