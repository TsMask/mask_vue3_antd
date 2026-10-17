<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, toRaw, computed, onMounted } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'antdv-next';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import DictDataFormModal from './components/DictDataFormModal.vue';
import {
  exportDictData,
  listDictData,
  delDictData,
} from '@/api/system/dict/data';
import { getDictOption, getDictType } from '@/api/system/dict/type';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date';
import { useTabsView } from '@/hooks/useTabsView';
import { isSuccess } from '@/api/httpClient';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const { closeTab } = useTabsView();
const route = useRoute();
const router = useRouter();
const routeDictId = route.params && (route.params.dictId as string);
const defaultDictType = ref<string>();
const dictTypeOptions = ref<DictType[]>([]);
/** 路由指定具体字典类型时，查询与表单都保持该类型，避免误切到全量数据。 */
const lockedDictType = computed(() =>
  Boolean(routeDictId && routeDictId !== '0')
);

const { dict: sysDict } = useDictSetup({
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
  queryFn: listDictData,
  defaultPageSize: 20,
  manual: true,
  rowKey: 'id',
});

const dictDataFormModal = ref<InstanceType<typeof DictDataFormModal> | null>(
  null
);
const { confirmAction } = useModalAction();

const tableColumns = computed<ProColumns[]>(() => [
  { title: '数据编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '数据标签', dataIndex: 'data_label', align: 'left', width: 200 },
  { title: '数据键值', dataIndex: 'data_value', align: 'left', width: 200 },
  { title: '数据排序', dataIndex: 'data_sort', align: 'left', width: 100 },
  {
    title: '数据状态',
    dataIndex: 'data_status',
    key: 'data_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(sysDict.sysNormalDisable),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 150,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '字典类型',
    dataIndex: 'dict_type',
    valueType: 'select',
    valueEnum: toProValueEnum(dictTypeOptions.value),
    fieldProps: { showSearch: true, disabled: lockedDictType.value },
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 130,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  {
    title: '字典类型',
    dataIndex: 'dict_type',
    valueType: 'select',
    valueEnum: toProValueEnum(dictTypeOptions.value),
    defaultValue: defaultDictType.value,
    fieldProps: { showSearch: true },
  },
  { title: '数据标签', dataIndex: 'data_label' },
  {
    title: '数据状态',
    dataIndex: 'data_status',
    valueType: 'select',
    valueEnum: toProValueEnum(sysDict.sysNormalDisable),
  },
]);

/** 详情直接复用行数据，避免再次请求接口。 */
function handleView(row: Record<string, any>) {
  dictDataFormModal.value?.openView(row);
}

/** 新增时优先继承当前搜索或路由锁定的字典类型 */
function handleEdit(id?: string | number) {
  dictDataFormModal.value?.openEdit(
    id,
    searchValues.value.dict_type ?? defaultDictType.value
  );
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
    content: `确认删除字典数据编号为【${id}】的数据项?`,
    action: () => delDictData(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

/** 导出保持当前字典类型、搜索条件和分页范围 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () =>
      exportDictData({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      }),
    successText: '已导出完成',
    onSuccess: res => saveAs(res.data, `dict_data_${Date.now()}.csv`),
  });
}

/** 优先跳到页签关闭逻辑给出的目标页，无目标时回退历史 */
function handleClose() {
  const to = closeTab(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}

onMounted(async () => {
  // 先准备字典类型选项，再按路由锁定类型发起首次查询。
  const optRes = await getDictOption();
  if (isSuccess(optRes)) {
    dictTypeOptions.value = optRes.data;
  }
  if (lockedDictType.value) {
    const res = await getDictType(routeDictId);
    if (isSuccess(res) && res.data) {
      defaultDictType.value = res.data.dict_type;
    } else {
      message.error({ content: '获取字典类型信息失败', duration: 3 });
    }
  }
  await onSearch(
    defaultDictType.value ? { dict_type: defaultDictType.value } : {}
  );
});
</script>

<template>
  <PageContainer>
    <template #content>
      <a-typography-paragraph>
        字典数据按类型分类，每个字典类型下包含多个数据项，每个数据项都有一个唯一的键值对，映射数据。
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
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: {
          columnsStateKey: 'system-dict-data',
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
          <a-button type="default" @click.prevent="handleClose()">
            <template #icon>
              <CloseOutlined />
            </template>
            关闭
          </a-button>
          <a-button
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['system:dict:data:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新增
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()"
            v-perms:has="['system:dict:data:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:dict:data:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'data_status'">
          <DictTag
            :options="sysDict.sysNormalDisable"
            :value="record.data_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record)"
                v-perms:has="['system:dict:data:query']"
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
                v-perms:has="['system:dict:data:edit']"
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
                v-perms:has="['system:dict:data:remove']"
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

    <DictDataFormModal
      ref="dictDataFormModal"
      :dict-type-options="dictTypeOptions"
      :locked-dict-type="lockedDictType"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>
