<script setup lang="ts">
import { toRaw, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import { authUserList } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';

const emit = defineEmits(['ok', 'cancel', 'update:open']);
const props = defineProps({
  title: {
    type: String,
    default: '标题',
  },
  open: {
    type: Boolean,
    default: false,
  },
  roleId: {
    type: [Number, String],
    required: true,
  },
});

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({ keyMap: { sysNormalDisable: 'sys_normal_disable', } });

/** 查询参数 */
const { queryParams, handleQuery, resetQuery } = useQueryParams(
  {
    userName: '',
    phone: '',
    statusFlag: undefined as string | undefined,
    roleId: props.roleId,
    auth: false,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    resetPage();
    fetchList();
  },
);

/** 分页管理 */
const { pagination, resetPage } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList()
  },
});

/** 列表数据查询：仅在弹窗打开时自动查询 */
const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => authUserList(toRaw(queryParams)),
});

/** 表格UI状态 */
const { tableState, setSelectedRowKeys, clearSelection } = useTableUI({
  defaultSize: 'small',
});

/** 表格字段列 */
let tableColumns: ColumnsType = [
  { title: '用户编号', dataIndex: 'userId', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'userName', align: 'left', width: 150 },
  { title: '用户昵称', dataIndex: 'nickName', align: 'left', width: 150 },
  { title: '用户状态', dataIndex: 'statusFlag', key: 'statusFlag', align: 'left', width: 100 },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
];

/** 弹框确认按钮事件 */
function handleOk() {
  const userIds = tableState.selectedRowKeys;
  if (userIds.length <= 0) {
    message.error({ content: '请选择要分配的用户', duration: 3 });
    return;
  }
  emit('update:open', false);
  emit('ok', userIds);
}

/** 弹框取消按钮事件 */
function handleCancel() {
  emit('update:open', false);
  emit('cancel');
}

/** 弹窗打开时初始化字典并重置页码 */
watch(
  () => props.open,
  (val) => {
    if (val) {
      loadDicts();
      queryParams.pageNum = 1;
      clearSelection();
    }
  },
);
</script>

<template>
  <a-modal :drag="true" :fullscreen="true" :forceFullscreen="true" :destroyOnClose="true" :width="800"
    :title="props.title" :open="props.open" :keyboard="false" :mask-closable="false" @ok="handleOk"
    @cancel="handleCancel">
    <a-form :model="queryParams" name="queryParams" layout="horizontal">
      <a-row :gutter="16">
        <a-col :lg="8" :md="12" :xs="24">
          <a-form-item label="登录账号" name="userName">
            <a-input v-model:value="queryParams.userName" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
          </a-form-item>
        </a-col>
        <a-col :lg="10" :md="12" :xs="24">
          <a-form-item label="手机号码" name="phone">
            <a-input v-model:value="queryParams.phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
          </a-form-item>
        </a-col>
        <a-col :lg="6" :md="12" :xs="24">
          <a-form-item label="用户状态" name="statusFlag">
            <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择用户状态"
              :options="dict.sysNormalDisable">
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item>
            <a-space :size="8">
              <a-button type="primary" @click.prevent="handleQuery">
                <template #icon>
                  <SearchOutlined />
                </template>
                搜索
              </a-button>
              <a-button type="default" @click.prevent="resetQuery">
                <template #icon>
                  <ClearOutlined />
                </template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <a-table class="table" row-key="userId" :columns="tableColumns" :loading="loading" :data-source="listData"
      :size="tableState.size" :scroll="{
        x: tableColumns.length * 120,
        scrollToFirstRowOnChange: true,
        y: 400,
      }" :pagination="{ ...pagination }" :row-selection="{
        type: 'checkbox',
        selectedRowKeys: tableState.selectedRowKeys,
        onChange: setSelectedRowKeys,
      }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'statusFlag'">
          <DictTag :options="dict.sysNormalDisable" :value="record.statusFlag" />
        </template>
      </template>
    </a-table>
  </a-modal>
</template>

<style lang="less" scoped></style>
