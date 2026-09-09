<script setup lang="ts">
import { computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import { authUserList } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const emit = defineEmits<{
  ok: [userIds: (string | number)[]];
  cancel: [];
  'update:open': [open: boolean];
}>();

const props = withDefaults(
  defineProps<{
    title?: string;
    open?: boolean;
    roleId: string | number;
  }>(),
  {
    title: '选择用户',
    open: false,
  }
);

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

/** 列表数据查询：仅在弹窗打开时自动查询 */
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
  clearSelected,
} = useProTable({
  queryFn: authUserList,
  params: () => ({ role_id: props.roleId, auth: false }),
  defaultPageSize: 20,
  manual: true,
  rowKey: 'id',
});

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '用户编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'user_name', align: 'left', width: 150 },
  { title: '手机号码', dataIndex: 'user_phone', align: 'left', width: 150 },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    key: 'user_status',
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
]);

const tableScroll = useProTableScroll(tableColumns, { y: 400 });

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '登录账号', dataIndex: 'user_name' },
  { title: '手机号码', dataIndex: 'user_phone', fieldProps: { maxlength: 11 } },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

/** 弹框确认按钮事件 */
function handleConfirm() {
  const userIds = selectedRowKeys.value;
  if (userIds.length <= 0) {
    message.error({ content: '请选择要分配的用户', duration: 3 });
    return;
  }
  emit('update:open', false);
  emit('ok', userIds);
}

/** 弹框取消按钮事件 */
function handleClose() {
  emit('update:open', false);
  emit('cancel');
}

/** 弹窗打开时初始化字典并重置页码 */
watch(
  () => props.open,
  val => {
    if (val) {
      loadDicts();
      clearSelected();
      reload(true);
    }
  }
);
</script>

<template>
  <a-modal
    :drag="true"
    :fullscreen="true"
    :forceFullscreen="true"
    :destroyOnClose="true"
    :width="800"
    :title="props.title"
    :open="props.open"
    :keyboard="false"
    :mask-closable="false"
    @ok="handleConfirm"
    @cancel="handleClose"
  >
    <ProTable
      row-key="id"
      size="small"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
      :scroll="tableScroll"
      :search="{
        columns: searchColumns,
        onSearch,
        onReset,
        defaultColsNumber: 2,
      }"
      :toolbar="false"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.user_status"
          />
        </template>
      </template>
    </ProTable>
  </a-modal>
</template>
