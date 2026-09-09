<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import ConfigFormModal from './components/ConfigFormModal.vue';
import {
  exportConfig,
  listConfig,
  delConfig,
  refreshConfig,
} from '@/api/system/config';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

/** 参数组与状态同时用于列表、查询；键值类型只在表单弹窗内加载。 */
const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysConfigGroup: 'sys_config_group',
  },
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
  queryFn: listConfig,
  defaultPageSize: 20,
  rowKey: 'id',
});

const configFormModal = ref<InstanceType<typeof ConfigFormModal> | null>(null);
const { confirmAction } = useModalAction();

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '参数编号', dataIndex: 'id', align: 'left', width: 100 },
  {
    title: '参数组',
    dataIndex: 'config_group',
    key: 'config_group',
    align: 'left',
    width: 120,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysConfigGroup),
  },
  {
    title: '参数名称',
    dataIndex: 'config_name',
    align: 'left',
    width: 200,
    ellipsis: true,
  },
  {
    title: '参数键名',
    dataIndex: 'config_key',
    align: 'left',
    width: 200,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'config_status',
    key: 'config_status',
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
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 150,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

/** 查询字段 */
const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '参数名称', dataIndex: 'config_name' },
  { title: '参数键名', dataIndex: 'config_key' },
  {
    title: '参数组',
    dataIndex: 'config_group',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysConfigGroup),
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
  configFormModal.value?.openView(id);
}

function handleEdit(id?: string | number) {
  configFormModal.value?.openEdit(id);
}

function handleFormSuccess() {
  reload();
}

/** 删除参数配置（单条或批量） */
function handleDelete(id: string = '0') {
  const configId = id === '0' ? selectedRowKeys.value.join(',') : id;
  confirmAction({
    content: `确认删除参数编号为【${configId}】的数据项?`,
    action: () => delConfig(configId),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(configId).split(',').map(Number));
      reload();
    },
  });
}

/** 导出参数配置列表 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () =>
      exportConfig({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `config_${Date.now()}.csv`);
    },
  });
}

/** 刷新系统参数配置缓存 */
function handleRefreshConfig() {
  confirmAction({
    content: '确定要刷新参数配置缓存吗?',
    action: () => refreshConfig(),
    successText: '刷新缓存成功',
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        系统内可配置的参数变量。
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
        columns: searchColumns,
        labelWidth: 100,
        labelWrap: true,
        onSearch,
        onReset,
      }"
      :toolbar="{
        setting: {
          columnsStateKey: 'system-config',
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
            v-perms:has="['system:config:add']"
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
            v-perms:has="['system:config:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="handleRefreshConfig"
            v-perms:has="['system:config:remove']"
          >
            <template #icon>
              <SyncOutlined />
            </template>
            刷新缓存
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:config:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'config_group'">
          <DictTag
            :options="dict.sysConfigGroup"
            :value="record.config_group"
          />
        </template>
        <template v-if="column.key === 'config_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.config_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:config:query']"
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
                v-perms:has="['system:config:edit']"
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
                v-perms:has="['system:config:remove']"
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

    <ConfigFormModal ref="configFormModal" @success="handleFormSuccess" />
  </PageContainer>
</template>
