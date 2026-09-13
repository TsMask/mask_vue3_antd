<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import PostFormModal from './components/PostFormModal.vue';
import { exportPost, listPost, delPost } from '@/api/system/post';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

/** 岗位状态字典同时驱动查询、表格展示和表单选项。 */
const { dict } = useDictSetup({
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

/** 列表数据查询 */
const {
  dataSource,
  loading,
  pagination,
  current,
  pageSize,
  searchValues,
  onSearch,
  onReset,
  onTableChange,
  reload,
  rowSelection,
  selectedRowKeys,
  removeSelectedRowKeys,
} = useProTable({
  queryFn: listPost,
  defaultPageSize: 20,
  rowKey: 'id',
});

const postFormModal = ref<InstanceType<typeof PostFormModal> | null>(null);
const { confirmAction } = useModalAction();

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '岗位编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '岗位编码', dataIndex: 'post_code', align: 'left', width: 200 },
  { title: '岗位名称', dataIndex: 'post_name', align: 'left', width: 200 },
  { title: '岗位排序', dataIndex: 'post_sort', align: 'left', width: 100 },
  {
    title: '状态',
    dataIndex: 'post_status',
    key: 'post_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  { title: '操作', key: 'operation', align: 'left', width: 150 },
]);

const tableScroll = useProTableScroll(tableColumns);

/** 查询字段 */
const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '岗位编码', dataIndex: 'post_code' },
  { title: '岗位名称', dataIndex: 'post_name' },
  {
    title: '状态',
    dataIndex: 'post_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

function handleView(id: string | number) {
  postFormModal.value?.openView(id);
}

function handleEdit(id?: string | number) {
  postFormModal.value?.openEdit(id);
}

function handleFormSuccess() {
  reload();
}

/** 支持行内删除和批量删除，默认 0 表示使用当前选中行 */
function handleDelete(id: string = '0') {
  const postId = id === '0' ? selectedRowKeys.value.join(',') : id;
  confirmAction({
    content: `确认删除岗位编号为【${postId}】的数据项?`,
    action: () => delPost(postId),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(
        String(postId)
          .split(',')
          .map(item => Number(item))
      );
      reload();
    },
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () =>
      exportPost({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `post_${Date.now()}.csv`);
    },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户岗位标记 </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      :scroll="tableScroll"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: { columnsStateKey: 'system-post', columnsStateType: 'local' },
        onReload: reload,
      }"
      @change="onTableChange"
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
            v-perms:has="['system:post:add']"
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
            v-perms:has="['system:post:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:post:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'post_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.post_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:post:query']"
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
                v-perms:has="['system:post:edit']"
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
                v-perms:has="['system:post:remove']"
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

    <PostFormModal ref="postFormModal" @success="handleFormSuccess" />
  </PageContainer>
</template>
