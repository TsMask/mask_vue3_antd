<script setup lang="ts">
import { reactive, toRaw, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import type { ColumnsType } from 'ant-design-vue/es/table';
import { authUserList } from '@/api/system/role';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { getDict } = useDictStore();
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

/**字典数据 */
let dict: {
  /**状态 */
  sysNormalDisable: DictType[];
} = reactive({
  sysNormalDisable: [],
});

/**查询参数 */
let queryParams = reactive({
  /**登录账号 */
  userName: '',
  /**手机号码 */
  phone: '',
  /**用户状态 */
  statusFlag: undefined,
  /**角色ID */
  roleId: props.roleId,
  /**是否已分配 */
  auth: false,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
    Object.assign(queryParams, {
    userName: '',
    phone: '',
    statusFlag: undefined,
    pageNum: 1,
    pageSize: 20,
  });
  tablePagination.current = 1;
  tablePagination.pageSize = 20;
  fnGetList();
}

/**表格状态类型 */
type TabeStateType = {
  /**加载等待 */
  loading: boolean;
  /**紧凑型 */
  size: SizeType;
  /**记录数据 */
  data: object[];
  /**勾选记录 */
  selectedRowKeys: (string | number)[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'small',
  data: [],
  selectedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '用户编号',
    dataIndex: 'userId',
    align: 'left',
    width: 100,
  },
  {
    title: '登录账号',
    dataIndex: 'userName',
    align: 'left',
    width: 150,
  },
  {
    title: '用户昵称',
    dataIndex: 'nickName',
    align: 'left',
    width: 150,
  },
  {
    title: '用户状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
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

/**表格分页器参数 */
let tablePagination = reactive({
  /**当前页数 */
  current: 1,
  /**每页条数 */
  pageSize: 20,
  /**默认的每页条数 */
  defaultPageSize: 20,
  /**指定每页可以显示多少条 */
  pageSizeOptions: ['10', '20', '50', '100'],
  /**只有一页时是否隐藏分页器 */
  hideOnSinglePage: false,
  /**是否可以快速跳转至某页 */
  showQuickJumper: true,
  /**是否可以改变 pageSize */
  showSizeChanger: true,
  /**数据总数 */
  total: 0,
  showTotal: (total: number) => `总共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    tablePagination.current = page;
    tablePagination.pageSize = pageSize;
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fnGetList();
  },
});

/**表格多选 */
function fnTableSelectedRowKeys(keys: (string | number)[]) {
  tableState.selectedRowKeys = keys;
}

/**查询角色未授权用户列表, pageNum初始页数 */
function fnGetList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  authUserList(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      // 取消勾选
      if (tableState.selectedRowKeys.length > 0) {
        tableState.selectedRowKeys = [];
      }
      const { total, rows } = res.data;
      tablePagination.total = total;
      tableState.data = rows;
    }
    tableState.loading = false;
  });
}

/**弹框确认按钮事件 */
function fnModalOk() {
  const userIds = tableState.selectedRowKeys;
  if (userIds.length <= 0) {
    message.error(`请选择要分配的用户`, 2);
    return;
  }
  emit('update:open', false);
  emit('ok', userIds);
}

/**弹框取消按钮事件 */
function fnModalCancel() {
  emit('update:open', false);
  emit('cancel');
}

/**显示弹框时初始数据 */
function init() {
  // 初始字典数据
  Promise.allSettled([getDict('sys_normal_disable')]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
    }
  });
  // 获取列表数据
  fnGetList(1);
}

/**监听是否显示，初始数据 */
watch(
  () => props.open,
  val => {
    if (val) init();
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
    @ok="fnModalOk"
    @cancel="fnModalCancel"
  >
    <!-- 表格搜索栏 -->
    <a-form :model="queryParams" name="queryParams" layout="horizontal">
      <a-row>
        <a-col :lg="8" :md="12" :xs="24">
          <a-form-item label="登录账号" name="userName">
            <a-input
              v-model:value="queryParams.userName"
              allow-clear
              :maxlength="30"
              placeholder="请输入登录账号"
            ></a-input>
          </a-form-item>
        </a-col>
        <a-col :lg="10" :md="12" :xs="24">
          <a-form-item label="手机号码" name="phone">
            <a-input
              v-model:value="queryParams.phone"
              allow-clear
              :maxlength="11"
              placeholder="请输入手机号码"
            ></a-input>
          </a-form-item>
        </a-col>
        <a-col :lg="6" :md="12" :xs="24">
          <a-form-item label="用户状态" name="statusFlag">
            <a-select
              v-model:value="queryParams.statusFlag"
              allow-clear
              placeholder="请选择用户状态"
              :options="dict.sysNormalDisable"
            >
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item>
            <a-space :size="8">
              <a-button type="primary" @click.prevent="fnGetList(1)">
                <template #icon><SearchOutlined /></template>
                搜索
              </a-button>
              <a-button type="default" @click.prevent="fnQueryReset">
                <template #icon><ClearOutlined /></template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <a-table
      class="table"
      row-key="userId"
      :columns="tableColumns"
      :loading="tableState.loading"
      :data-source="tableState.data"
      :size="tableState.size"
      :scroll="{
        x: tableColumns.length * 120,
        scrollToFirstRowOnChange: true,
        y: 400,
      }"
      :pagination="tablePagination"
      :row-selection="{
        type: 'checkbox',
        selectedRowKeys: tableState.selectedRowKeys,
        onChange: fnTableSelectedRowKeys,
      }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'statusFlag'">
          <DictTag :options="dict.sysNormalDisable" :value="record.statusFlag" />
        </template>
      </template>
    </a-table>
  </a-modal>
</template>

<style lang="less" scoped></style>
