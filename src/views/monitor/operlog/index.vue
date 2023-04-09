<script setup lang="ts">
import {
  ExportOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportOperlog,
  listOperlog,
  delOperlog,
  cleanOperlog,
} from '@/api/monitor/operlog';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/DateUtils';
import useDictStore from '@/store/modules/dict';
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
      return parseDateToStr(+opt.value);
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
function fnTableStriped(_record: unknown, index: number) {
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
      delOperlog(ids).then(res => {
        if (res.code === 200) {
          message.success(`删除成功`, 1.5);
          fnGetList();
        } else {
          message.error(`${res.msg}`, 1.5);
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
      cleanOperlog().then(res => {
        if (res.code === 200) {
          message.error(`清空成功`, 1.5);
        } else {
          message.error(`${res.msg}`, 1.5);
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
      exportOperlog(toRaw(queryParams)).then(resBlob => {
        if (resBlob.type === 'application/json') {
          resBlob
            .text()
            .then(txt => {
              const txtRes = JSON.parse(txt);
              message.error(`${txtRes.msg}`, 1.5);
            })
            .catch(_ => {
              message.error(`导出数据异常`, 1.5);
            });
        } else {
          saveAs(resBlob, `operlog_${Date.now()}.xlsx`);
        }
      });
    },
  });
}

/**查询登录日志列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  queryParams.beginTime = queryRangePicker.value[0];
  queryParams.endTime = queryRangePicker.value[1];
  listOperlog(toRaw(queryParams)).then(res => {
    if (res.code === 200 && Array.isArray(res.rows)) {
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
  <page-container :title="title">
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
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button type="dashed" danger @click.prevent="fnCleanList()">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button type="dashed" @click.prevent="fnExportList()">
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
          onChange: keys => fnTableSelectedRowKeys(keys),
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
              {{ modalState.from.operUrl }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作时间" name="operTime">
              {{ parseDateToStr(+modalState.from.operTime) }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求方式" name="requestMethod">
              {{ modalState.from.requestMethod }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作方法" name="method">
              {{ modalState.from.method }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="请求参数" name="operParam">
          {{ modalState.from.operParam }}
        </a-form-item>
        <a-form-item label="操作信息" name="operMsg">
          {{ modalState.from.operMsg }}
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="fnModalCancel">关闭</a-button>
      </template>
    </a-modal>
  </page-container>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
