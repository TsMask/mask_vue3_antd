<script setup lang="ts">
import {
  ExportOutlined,
  CloseOutlined,
  ProfileOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportJobLog,
  listJobLog,
  delJobLog,
  cleanJobLog,
} from '@/api/monitor/jobLog';
import { getJob } from '@/api/monitor/job';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils.js';
import useTabsStore from '@/store/modules/tabs';
import useDictStore from '@/store/modules/dict';
const tabsStore = useTabsStore();
const { getDict } = useDictStore();
const route = useRoute();
const router = useRouter();

// 获取地址栏参数
const jobId = route.params && (route.params.jobId as string);

/**字典数据 */
let dict: {
  /**任务组名 */
  sysJobGroup: DictType[];
  /**执行状态 */
  sysCommonStatus: DictType[];
} = reactive({
  sysJobGroup: [],
  sysCommonStatus: [],
});

/**记录开始结束时间 */
let queryRangePicker = ref<[string, string]>(['', '']);

/**查询参数 */
let queryParams = reactive({
  /**任务名称 */
  jobName: '',
  /**任务组名 */
  jobGroup: undefined,
  /**执行状态 */
  status: undefined,
  /**记录开始时间 */
  beginTime: '',
  /**记录结束时间 */
  endTime: '',
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  if (jobId && jobId !== '0') {
    queryParams = Object.assign(queryParams, {
      status: undefined,
      beginTime: '',
      endTime: '',
      pageNum: 1,
      pageSize: 20,
    });
  } else {
    queryParams = Object.assign(queryParams, {
      jobName: '',
      jobGroup: undefined,
      status: undefined,
      beginTime: '',
      endTime: '',
      pageNum: 1,
      pageSize: 20,
    });
  }
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
  seached: true,
  data: [],
  selectedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '日志编号',
    dataIndex: 'jobLogId',
    align: 'center',
  },
  {
    title: '任务名称',
    dataIndex: 'jobName',
    align: 'center',
  },
  {
    title: '任务组名',
    dataIndex: 'jobGroup',
    key: 'jobGroup',
    align: 'center',
  },
  {
    title: '调用目标',
    dataIndex: 'invokeTarget',
    align: 'center',
  },
  {
    title: '执行状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '记录时间',
    dataIndex: 'createTime',
    align: 'center',
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'jobLogId',
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
  title: '任务日志',
  from: {
    jobLogId: undefined,
    jobName: '',
    jobGroup: 'DEFAULT',
    invokeTarget: '',
    targetParams: '',
    status: '0',
    jobMsg: '',
    createTime: 0,
  },
});

/**
 * 对话框弹出显示为 查看
 * @param row 调度日志信息对象
 */
function fnModalVisibleByVive(row: Record<string, string>) {
  modalState.from = Object.assign(modalState.from, row);
  modalState.title = '调度日志信息';
  modalState.visibleByView = true;
}

/**
 * 对话框弹出关闭执行函数
 */
function fnModalCancel() {
  modalState.visibleByView = false;
}

/**
 * 任务删除
 */
function fnRecordDelete() {
  const ids = tableState.selectedRowKeys.join(',');
  Modal.confirm({
    title: '提示',
    content: `确认删除调度日志编号为 【${ids}】 的数据项吗?`,
    onOk() {
      const key = 'delJobLog';
      message.loading({ content: '请稍等...', key });
      delJobLog(ids).then(res => {
        if (res.code === 200) {
          message.success({
            content: `删除成功`,
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
    content: `确认清空所有调度日志数据项吗?`,
    onOk() {
      const key = 'cleanJobLog';
      message.loading({ content: '请稍等...', key });
      cleanJobLog().then(res => {
        if (res.code === 200) {
          message.success({
            content: `清空成功`,
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
      const key = 'exportJobLog';
      message.loading({ content: '请稍等...', key });
      exportJobLog(toRaw(queryParams)).then(resBlob => {
        if (resBlob.type === 'application/json') {
          resBlob
            .text()
            .then(txt => {
              const txtRes = JSON.parse(txt);
              message.error({
                content: `${txtRes.msg}`,
                key,
                duration: 2,
              });
            })
            .catch(_ => {
              message.error({
                content: '导出数据异常',
                key,
                duration: 2,
              });
            });
        } else {
          message.success({
            content: `已完成导出`,
            key,
            duration: 2,
          });
          saveAs(resBlob, `job_log_${Date.now()}.xlsx`);
        }
      });
    },
  });
}

/**关闭跳转 */
function fnClose() {
  const to = tabsStore.tabClose(route.path);
  if (!to) return;
  router.push(to);
}

/**查询调度日志列表 */
function fnGetList() {
  tableState.loading = true;
  queryParams.beginTime = queryRangePicker.value[0];
  queryParams.endTime = queryRangePicker.value[1];
  listJobLog(toRaw(queryParams)).then(res => {
    if (res.code === 200) {
      // 取消勾选
      if (tableState.selectedRowKeys.length > 0) {
        tableState.selectedRowKeys = [];
      }
      tablePagination.total = res.total;
      tableState.data = res.rows;
      tableState.loading = false;
    }
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([
    getDict('sys_job_group'),
    getDict('sys_common_status'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysJobGroup = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.sysCommonStatus = resArr[1].value;
    }
  });
  // 指定任务id数据列表
  if (jobId && jobId !== '0') {
    getJob(jobId).then(res => {
      if (res.code === 200) {
        queryParams.jobName = res.data.jobName;
        queryParams.jobGroup = res.data.jobGroup;
        fnGetList();
      }
    });
  } else {
    // 获取列表数据
    fnGetList();
  }
});
</script>

<template>
  <page-container>
    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">
              <a-input
                v-model:value="queryParams.jobName"
                :allow-clear="jobId === '0'"
                :disabled="jobId !== '0'"
                placeholder="请输入任务名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <a-select
                v-model:value="queryParams.jobGroup"
                allow-clear
                placeholder="请选择菜单状态"
                :options="dict.sysJobGroup"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="执行状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择执行状态"
                :options="dict.sysCommonStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="记录时间" name="queryRangePicker">
              <a-range-picker
                v-model:value="queryRangePicker"
                allow-clear
                bordered
                value-format="YYYY-MM-DD"
                :placeholder="['记录开始', '记录结束']"
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
          <a-button type="default" @click.prevent="fnClose()">
            <template #icon><CloseOutlined /></template>
            关闭
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['monitor:job:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="fnCleanList()"
            v-perms:has="['monitor:job:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['monitor:job:export']"
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
        row-key="jobLogId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{ x: true }"
        :pagination="tablePagination"
        :row-selection="{
          type: 'checkbox',
          onChange: fnTableSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="+record.status ? 'success' : 'error'">
              {{ ['失败', '正常'][+record.status] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'jobLogId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record)"
                  v-perms:has="['monitor:job:query']"
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
            <a-form-item label="日志编号" name="jobLogId">
              {{ modalState.from.jobLogId }}
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
            <a-form-item label="任务名称" name="jobName">
              {{ modalState.from.jobName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <DictTag
                :options="dict.sysJobGroup"
                :value="modalState.from.jobGroup"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="invokeTarget">
              {{ modalState.from.invokeTarget }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录时间" name="createTime">
              <span v-if="+modalState.from.createTime > 0">
                {{ parseDateToStr(+modalState.from.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="传入参数" name="targetParams">
          {{ modalState.from.targetParams }}
        </a-form-item>
        <a-form-item label="日志信息" name="jobMsg">
          {{ modalState.from.jobMsg }}
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
