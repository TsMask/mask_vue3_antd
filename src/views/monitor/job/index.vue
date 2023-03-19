<script setup lang="ts">
import {
  EditOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import { forceLogout, listOnline } from '@/api/monitor/online';
import {
  listJob,
  getJob,
  delJob,
  addJob,
  updateJob,
  runJob,
  changeJobStatus,
  resetQueueJob,
} from '@/api/monitor/job';
import { parseDateToStr, YYYY_MM_DD_HH_MM_SS } from '@/utils/DateUtils';
import useDictStore from '@/store/modules/dict';
import { Key } from 'ant-design-vue/lib/_util/type';
const { getDict } = useDictStore();
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**任务组名 */
  sysJobGroup: DictType[];
  /**任务状态 */
  sysJobStatus: DictType[];
} = reactive({
  sysJobGroup: [],
  sysJobStatus: [],
});

/**查询参数 */
let queryParams = reactive({
  /**任务名称 */
  jobName: '',
  /**任务组名 */
  jobGroup: undefined,
  /**任务状态 */
  status: undefined,
});

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
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: false,
  data: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '任务编号',
    dataIndex: 'jobId',
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
    title: 'cron表达式',
    dataIndex: 'cronExpression',
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '操作',
    key: 'jobId',
    align: 'center',
  },
];

/**表格分页器参数 */
let tablePagination = {
  /**当前页数 */
  current: 1,
  /**每页条数 */
  pageSize: 20,
  /**默认的每页条数 */
  defaultPageSize: 20,
  /**指定每页可以显示多少条 */
  pageSizeOptions: ['10', '20', '50', '100'],
  /**只有一页时是否隐藏分页器 */
  hideOnSinglePage: true,
  /**是否可以快速跳转至某页 */
  showQuickJumper: false,
  /**是否可以改变 pageSize */
  showSizeChanger: false,
  /**数据总数 */
  total: 0,
  showTotal: (total: number) => `总共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    tablePagination.current = page;
    tablePagination.pageSize = pageSize;
  },
};

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number) {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/** 重置按钮操作 */
function fnResetQuery() {
  queryParams.jobName = '';
  queryParams.jobGroup = undefined;
  queryParams.status = undefined;
  tablePagination.current = 1;
  tablePagination.pageSize = 20;
  getList();
}

function fnTableSelectedRowKeys(keys: (string | number)[]) {
  console.log(keys);
}

/**
 * 任务状态修改
 * @param row 任务信息对象
 */
function fnStatusChange(row: Record<string, string>) {
  const text = row.status === '1' ? '开启' : '关闭';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.jobName} 任务吗?`,
    onOk() {
      changeJobStatus(row.jobId, row.status).then(res => {
        if (res.code === 200) {
          message.success(`${text}成功`, 1.5);
        } else {
          message.error(`${text}失败`, 1.5);
        }
        getList();
      });
    },
    onCancel() {
      row.status = row.status === '1' ? '0' : '1';
    },
  });
}

/**
 * 立即执行一次
 * @param row 任务信息对象
 */
function fnRunOne(row: Record<string, string>) {
  Modal.confirm({
    title: '提示',
    content: `确定要立即执行一次 ${row.jobName} 任务吗?`,
    onOk() {
      runJob(row.jobId).then(res => {
        if (res.code === 200) {
          message.success(`执行成功`, 1.5);
        } else {
          message.error(`${res.msg}`, 1.5);
        }
      });
    },
  });
}

/**
 * 重置刷新队列
 */
function fnResetQueueJob() {
  Modal.confirm({
    title: '提示',
    content: `确定要重置并刷新调度任务吗?`,
    onOk() {
      resetQueueJob().then(res => {
        if (res.code === 200) {
          message.success(`重置成功`, 1.5);
        } else {
          message.error(`${res.msg}`, 1.5);
        }
      });
    },
  });
}

/**查询定时任务列表 */
function getList() {
  tableState.loading = true;
  listJob(queryParams).then(res => {
    if (res.code === 200) {
      tableState.data = res.rows;
      tableState.loading = false;
    }
  });
}

onMounted(async () => {
  // 初始字典数据
  dict.sysJobGroup = await getDict('sys_job_group');
  dict.sysJobStatus = await getDict('sys_job_status');
  // 获取列表数据
  getList();
});
</script>

<template>
  <page-container :title="title">
    <template #content>
      <a-typography-paragraph>
        登录用户
        <a-typography-text code>Token</a-typography-text>
        授权标识记录，存储在
        <a-typography-text code>Redis</a-typography-text>
        中，可撤销对用户的授权，拒绝用户请求并强制退出。
      </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form
        :model="queryParams"
        name="table-search"
        layout="horizontal"
        autocomplete="off"
      >
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">
              <a-input
                v-model:value="queryParams.jobName"
                allow-clear
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
            <a-form-item label="任务状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择任务状态"
                :options="dict.sysJobStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="getList">
                  <template #icon><SearchOutlined /></template>
                  搜索</a-button
                >
                <a-button type="default" @click.prevent="fnResetQuery">
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
          <a-button type="primary" @click.prevent="getList">
            <template #icon><ReloadOutlined /></template>
            新建
          </a-button>
          <a-button type="default" @click.prevent="fnResetQueueJob">
            <template #icon><ReloadOutlined /></template>
            重置队列
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
            <a-button type="text" @click.prevent="getList">
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
        row-key="jobId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="tablePagination"
        :scroll="{ x: true }"
        :row-selection="{
          type: 'checkbox',
          onChange: selectedRowKeys => fnTableSelectedRowKeys(selectedRowKeys),
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              checked-value="1"
              checked-children="开"
              un-checked-value="0"
              un-checked-children="关"
              size="default"
              @change="fnStatusChange(record)"
            />
          </template>
          <template v-if="column.key === 'jobId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="getList">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="getList">
                  <template #icon><EditOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>删除</template>
                <a-button type="link" @click.prevent="getList">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>执行一次</template>
                <a-button type="link" @click.prevent="fnRunOne(record)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>任务日志</template>
                <a-button type="link" @click.prevent="getList">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
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
