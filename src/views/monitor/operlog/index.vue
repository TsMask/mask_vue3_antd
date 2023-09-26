<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from '@ant-design-vue/pro-layout';
import { message, Modal } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import {
  exportOperlog,
  listOperlog,
  delOperlog,
  cleanOperlog,
} from '@/api/monitor/operlog';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { getDict } = useDictStore();
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**业务类型 */
  sysBusinessType: DictType[];
  /**登录状态 */
  sysCommonStatus: DictType[];
} = reactive({
  sysBusinessType: [],
  sysCommonStatus: [],
});

/**开始结束时间 */
let queryRangePicker = ref<[string, string]>(['', '']);

/**查询参数 */
let queryParams = reactive({
  /**操作模块 */
  title: '',
  /**操作人员 */
  operName: '',
  /**业务类型 */
  businessType: undefined,
  /**操作状态 */
  status: undefined,
  /**开始时间 */
  beginTime: '',
  /**结束时间 */
  endTime: '',
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  queryParams = Object.assign(queryParams, {
    title: '',
    operName: '',
    businessType: undefined,
    status: undefined,
    beginTime: '',
    endTime: '',
    pageNum: 1,
    pageSize: 20,
  });
  queryRangePicker.value = ['', ''];
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
  /**斑马纹 */
  striped: boolean;
  /**搜索栏 */
  seached: boolean;
  /**记录数据 */
  data: object[];
  /**勾选记录 */
  selectedRowKeys: (string | number)[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: false,
  data: [],
  selectedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '日志编号',
    dataIndex: 'operId',
    align: 'center',
  },
  {
    title: '模块名称',
    dataIndex: 'title',
    align: 'center',
  },
  {
    title: '业务类型',
    dataIndex: 'businessType',
    key: 'businessType',
    align: 'center',
  },
  {
    title: '操作人员',
    dataIndex: 'operName',
    align: 'center',
  },
  {
    title: '请求方式',
    dataIndex: 'requestMethod',
    align: 'center',
  },
  {
    title: '请求主机',
    dataIndex: 'operIp',
    align: 'center',
  },
  {
    title: '操作状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '操作日期',
    dataIndex: 'operTime',
    align: 'center',
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '消耗时间',
    dataIndex: 'costTime',
    key: 'costTime',
    align: 'center',
    customRender(opt) {
      return `${opt.value} ms`;
    },
  },
  {
    title: '操作',
    key: 'operId',
    align: 'center',
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

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number): any {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**表格多选 */
function fnTableSelectedRowKeys(keys: (string | number)[]) {
  tableState.selectedRowKeys = keys;
}

/**对话框对象信息状态类型 */
type ModalStateType = {
  /**详情框是否显示 */
  visibleByView: boolean;
  /**标题 */
  title: string;
  /**表单数据 */
  from: Record<string, any>;
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  title: '操作日志',
  from: {
    operId: undefined,
    businessType: 0,
    deptName: '',
    method: '',
    operIp: '',
    operLocation: '',
    operMsg: '',
    operName: '',
    operParam: '',
    operTime: 0,
    operUrl: '',
    operatorType: 1,
    requestMethod: 'PUT',
    status: 1,
    title: '',
  },
});

/**
 * 对话框弹出显示为 查看
 * @param row 操作日志信息对象
 */
function fnModalVisibleByVive(row: Record<string, string>) {
  modalState.from = Object.assign(modalState.from, row);
  modalState.title = '操作日志信息';
  modalState.visibleByView = true;
}

/**
 * 对话框弹出关闭执行函数
 */
function fnModalCancel() {
  modalState.visibleByView = false;
}

/**记录删除 */
function fnRecordDelete() {
  const ids = tableState.selectedRowKeys.join(',');
  Modal.confirm({
    title: '提示',
    content: `确认删除访问编号为 【${ids}】 的数据项吗?`,
    onOk() {
      const key = 'delOperlog';
      message.loading({ content: '请稍等...', key });
      delOperlog(ids).then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success({
            content: '删除成功',
            key,
            duration: 2,
          });
          fnGetList();
        } else {
          message.error({
            content: `${res.msg}`,
            key,
            duration: 2,
          });
        }
      });
    },
  });
}

/**列表清空 */
function fnCleanList() {
  Modal.confirm({
    title: '提示',
    content: `确认清空所有登录日志数据项?`,
    onOk() {
      const key = 'cleanOperlog';
      message.loading({ content: '请稍等...', key });
      cleanOperlog().then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success({
            content: '清空成功',
            key,
            duration: 2,
          });
          fnGetList();
        } else {
          message.error({
            content: `${res.msg}`,
            key,
            duration: 2,
          });
        }
      });
    },
  });
}

/**列表导出 */
function fnExportList() {
  Modal.confirm({
    title: '提示',
    content: `确认根据搜索条件导出xlsx表格文件吗?`,
    onOk() {
      const key = 'exportOperlog';
      message.loading({ content: '请稍等...', key });
      exportOperlog(toRaw(queryParams)).then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success({
            content: `已完成导出`,
            key,
            duration: 2,
          });
          saveAs(res.data, `operlog_${Date.now()}.xlsx`);
        } else {
          message.error({
            content: `${res.msg}`,
            key,
            duration: 2,
          });
        }
      });
    },
  });
}

/**查询登录日志列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  if (!queryRangePicker.value) {
    queryRangePicker.value = ['', ''];
  }
  queryParams.beginTime = queryRangePicker.value[0];
  queryParams.endTime = queryRangePicker.value[1];
  listOperlog(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.rows)) {
      // 取消勾选
      if (tableState.selectedRowKeys.length > 0) {
        tableState.selectedRowKeys = [];
      }
      tablePagination.total = res.total;
      tableState.data = res.rows;
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([
    getDict('sys_oper_type'),
    getDict('sys_common_status'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysBusinessType = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.sysCommonStatus = resArr[1].value;
    }
  });
  // 获取列表数据
  fnGetList();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        对接口请求进行日志收集，统计高频接口分析优化等操作。
      </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作模块" name="title">
              <a-input
                v-model:value="queryParams.title"
                allow-clear
                placeholder="请输入操作模块"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作人员" name="operName">
              <a-input
                v-model:value="queryParams.operName"
                allow-clear
                placeholder="请输入操作人员"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作类型" name="businessType">
              <a-select
                v-model:value="queryParams.businessType"
                allow-clear
                placeholder="请选择操作类型"
                :options="dict.sysBusinessType"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择操作状态"
                :options="dict.sysCommonStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="操作时间" name="queryRangePicker">
              <a-range-picker
                v-model:value="queryRangePicker"
                allow-clear
                bordered
                value-format="YYYY-MM-DD"
                :placeholder="['操作开始', '操作结束']"
                style="width: 100%"
              ></a-range-picker>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fnGetList">
                  <template #icon><SearchOutlined /></template>
                  搜索</a-button
                >
                <a-button type="default" @click.prevent="fnQueryReset">
                  <template #icon><ClearOutlined /></template>
                  重置</a-button
                >
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <!-- 插槽-卡片左侧侧 -->
      <template #title>
        <a-space :size="8" align="center">
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['monitor:operlog:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="fnCleanList()"
            v-perms:has="['monitor:operlog:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['monitor:operlog:export']"
          >
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip>
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="显"
              un-checked-children="隐"
              size="small"
            />
          </a-tooltip>
          <a-tooltip>
            <template #title>表格斑马纹</template>
            <a-switch
              v-model:checked="tableState.striped"
              checked-children="开"
              un-checked-children="关"
              size="small"
            />
          </a-tooltip>
          <a-tooltip>
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fnGetList">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip>
            <template #title>密度</template>
            <a-dropdown trigger="click">
              <a-button type="text">
                <template #icon><ColumnHeightOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu
                  :selected-keys="[tableState.size as string]"
                  @click="fnTableSize"
                >
                  <a-menu-item key="default">默认</a-menu-item>
                  <a-menu-item key="middle">中等</a-menu-item>
                  <a-menu-item key="small">紧凑</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>

      <!-- 表格列表 -->
      <a-table
        class="table"
        row-key="operId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{ x: true }"
        :pagination="tablePagination"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: fnTableSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'businessType'">
            <DictTag
              :options="dict.sysBusinessType"
              :value="record.businessType"
            />
          </template>
          <template v-if="column.key === 'status'">
            <DictTag :options="dict.sysCommonStatus" :value="record.status" />
          </template>
          <template v-if="column.key === 'operId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record)"
                  v-perms:has="['monitor:operlog:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                  详情
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <a-modal
      width="800px"
      :visible="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="日志编号" name="operId">
              {{ modalState.from.operId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="status">
              <a-tag :color="+modalState.from.status ? 'success' : 'error'">
                {{ ['失败', '正常'][+modalState.from.status] }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="业务类型" name="businessType">
              {{ modalState.from.title }} /
              <DictTag
                :options="dict.sysBusinessType"
                :value="modalState.from.businessType"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作人员" name="operName">
              {{ modalState.from.operName }} / {{ modalState.from.operIp }} /
              {{ modalState.from.operLocation }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求地址" name="operUrl">
              {{ modalState.from.requestMethod }} -
              {{ modalState.from.operUrl }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作时间" name="operTime">
              <span v-if="+modalState.from.operTime > 0">
                {{ parseDateToStr(+modalState.from.operTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求耗时" name="costTime">
              {{ modalState.from.costTime }} ms
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作方法" name="method">
              {{ modalState.from.method }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="请求参数" name="operParam">
          <a-textarea
            v-model:value="modalState.from.operParam"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="请求参数"
            :disabled="true"
          />
        </a-form-item>
        <a-form-item label="操作信息" name="operMsg">
          <a-textarea
            v-model:value="modalState.from.operMsg"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="操作信息"
            :disabled="true"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="fnModalCancel">关闭</a-button>
      </template>
    </a-modal>
  </PageContainer>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
