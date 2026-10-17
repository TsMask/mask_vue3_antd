<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import DictTypeFormModal from './components/DictTypeFormModal.vue';
import {
  exportDictType,
  listDictType,
  delDictType,
  refreshCache,
} from '@/api/system/dict/type';
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
const router = useRouter();

const title = ref<string>(route.meta.title ?? '标题');

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
  queryFn: listDictType,
  defaultPageSize: 20,
  rowKey: 'id',
});

const dictTypeFormModal = ref<InstanceType<typeof DictTypeFormModal> | null>(
  null
);
const { confirmAction } = useModalAction();

const tableColumns = computed<ProColumns[]>(() => [
  { title: '字典编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '字典名称', dataIndex: 'dict_name', align: 'left', width: 200 },
  { title: '字典类型', dataIndex: 'dict_type', align: 'left', width: 200 },
  {
    title: '字典状态',
    dataIndex: 'dict_status',
    key: 'dict_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 150,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  { title: '操作', key: 'operation', align: 'left', width: 130 },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '字典名称', dataIndex: 'dict_name' },
  {
    title: '字典状态',
    dataIndex: 'dict_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间范围',
    dataIndex: 'create_time',
    valueType: 'dateTimeRange',
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        create_time_begin: value?.[0]?.valueOf(),
        create_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

function handleView(id: string | number) {
  dictTypeFormModal.value?.openView(id);
}

function handleEdit(id?: string | number) {
  dictTypeFormModal.value?.openEdit(id);
}

function handleFormSuccess() {
  reload();
}

/** 支持行内删除和批量删除，默认 0 表示使用当前选中行 */
function handleDelete(id: string = '0') {
  if (id === '0') {
    id = selectedRowKeys.value.join(',');
  }
  confirmAction({
    content: `确认删除字典编号为【${id}】的数据项?`,
    action: () => delDictType(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

/** 导出保持与页面一致的搜索条件及分页参数 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () => {
      return exportDictType({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    successText: '已导出完成',
    onSuccess: res => saveAs(res.data, `dict_${Date.now()}.csv`),
  });
}

/** 刷新字典缓存，让普通用户的下一次页面加载拿到最新字典 */
function handleRefreshCache() {
  confirmAction({
    content: '确定要刷新字典数据缓存吗?',
    action: () => refreshCache(),
    successText: '刷新缓存成功',
  });
}

/** 进入字典数据页；0 表示不锁定具体类型，查看全部数据 */
function handleDataView(id: string | number = '0') {
  router.push({
    name: 'DictData',
    params: { dictId: String(id) },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        数据字典类型，数据名称对应的代码值映射数据。
      </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      @change="onTableChange"
      :scroll="tableScroll"
      :search="{
        defaultColsNumber: 2,
        columns: searchColumns,
        labelWidth: 100,
        labelWrap: true,
        onSearch,
        onReset,
      }"
      :toolbar="{
        setting: { columnsStateKey: 'system-dict', columnsStateType: 'local' },
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
            v-perms:has="['system:dict:type:add']"
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
            v-perms:has="['system:dict:type:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="default"
            @click.prevent="handleDataView()"
            v-perms:has="['system:dict:data:list']"
          >
            <template #icon>
              <ContainerOutlined />
            </template>
            字典数据
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="handleRefreshCache"
            v-perms:has="['system:dict:type:remove']"
          >
            <template #icon>
              <SyncOutlined />
            </template>
            刷新缓存
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:dict:type:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dict_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.dict_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:dict:type:query']"
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
                v-perms:has="['system:dict:type:edit']"
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
                v-perms:has="['system:dict:type:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>字典数据</template>
              <a-button
                type="link"
                @click.prevent="handleDataView(record.id)"
                v-perms:has="['system:dict:data:list']"
              >
                <template #icon>
                  <ContainerOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <DictTypeFormModal ref="dictTypeFormModal" @success="handleFormSuccess" />
  </PageContainer>
</template>
