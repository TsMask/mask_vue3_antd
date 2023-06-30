<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from '@ant-design-vue/pro-layout';
import { message, Modal, Form } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import {
  exportJob,
  listJob,
  getJob,
  delJob,
  addJob,
  updateJob,
  runJob,
  changeJobStatus,
  resetQueueJob,
} from '@/api/monitor/job';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
import { hasPermissions } from '@/plugins/auth-user';
import { MENU_PATH_INLINE } from '@/constants/menu-constants';
const { getDict } = useDictStore();
const route = useRoute();
const router = useRouter();

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
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  queryParams = Object.assign(queryParams, {
    jobName: '',
    jobGroup: undefined,
    status: undefined,
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
  /**新增框或修改框是否显示 */
  visibleByEdit: boolean;
  /**标题 */
  title: string;
  /**表单数据 */
  from: Record<string, any>;
  /**确定按钮 loading */
  confirmLoading: boolean;
  /**cron生成框是否显示 */
  visibleByCron: boolean;
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '任务',
  from: {
    jobId: undefined,
    jobName: '',
    invokeTarget: '',
    cronExpression: '',
    misfirePolicy: '3',
    concurrent: '0',
    jobGroup: 'DEFAULT',
    status: '0',
    targetParams: '',
    remark: '',
  },
  confirmLoading: false,
  visibleByCron: false,
});

/**对话框内表单属性和校验规则 */
const modalStateFrom = Form.useForm(
  modalState.from,
  reactive({
    jobName: [
      {
        required: true,
        min: 2,
        max: 20,
        message: '请正确输入任务名称，限2-20个字符',
      },
    ],
    invokeTarget: [
      {
        required: true,
        min: 2,
        max: 20,
        message: '请正确输入调用目标，限2-20个字符',
      },
    ],
    cronExpression: [
      {
        required: true,
        min: 6,
        message: '请输入或生成cron执行表达式',
      },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param jobId 任务id
 */
function fnModalVisibleByVive(jobId: string | number) {
  if (!jobId) {
    message.error(`任务记录存在错误`, 2);
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  getJob(jobId).then(res => {
    modalState.confirmLoading = false;
    hide();
    if (res.code === 200 && res.data) {
      modalState.from = Object.assign(modalState.from, res.data);
      modalState.title = '任务信息';
      modalState.visibleByView = true;
    } else {
      message.error(`获取任务信息失败`, 2);
    }
  });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param jobId 任务id, 不传为新增
 */
function fnModalVisibleByEdit(jobId?: string | number) {
  if (!jobId) {
    modalStateFrom.resetFields();
    modalState.title = '添加任务';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getJob(jobId).then(res => {
      modalState.confirmLoading = false;
      hide();
      if (res.code === 200 && res.data) {
        modalState.from = Object.assign(modalState.from, res.data);
        modalState.title = '修改任务';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取任务信息失败`, 2);
      }
    });
  }
}

/**
 * 对话框弹出确认执行函数
 * 进行表达规则校验
 */
function fnModalOk() {
  modalStateFrom
    .validate()
    .then(() => {
      modalState.confirmLoading = true;
      const from = toRaw(modalState.from);
      const job = from.jobId ? updateJob(from) : addJob(from);
      const key = 'job';
      message.loading({ content: '请稍等...', key });
      job
        .then(res => {
          if (res.code === 200) {
            message.success({
              content: `${modalState.title}成功`,
              key,
              duration: 2,
            });
            modalState.visibleByEdit = false;
            modalStateFrom.resetFields();
            fnGetList();
          } else {
            message.error({
              content: `${res.msg}`,
              key,
              duration: 2,
            });
          }
        })
        .finally(() => {
          modalState.confirmLoading = false;
        });
    })
    .catch(e => {
      message.error(`请正确填写 ${e.errorFields.length} 处必填信息！`, 2);
    });
}

/**
 * 对话框弹出关闭执行函数
 * 进行表达规则校验
 */
function fnModalCancel() {
  modalState.visibleByEdit = false;
  modalState.visibleByView = false;
  modalStateFrom.resetFields();
}

/**
 * 对话框弹出cron生成回调
 */
function fnModalCron(opt: boolean, cronStr?: string) {
  modalState.visibleByCron = opt;
  if (cronStr) {
    modalState.from.cronExpression = cronStr;
  }
}

/**
 * 任务状态修改
 * @param row 任务信息对象
 */
function fnRecordStatus(row: Record<string, string>) {
  const text = row.status === '1' ? '开启' : '关闭';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.jobName} 任务吗?`,
    onOk() {
      const key = 'changeJobStatus';
      message.loading({ content: '请稍等...', key });
      changeJobStatus(row.jobId, row.status).then(res => {
        if (res.code === 200) {
          message.success({
            content: `${row.jobName} ${text}成功`,
            key,
            duration: 2,
          });
        } else {
          message.error({
            content: `${res.msg}`,
            key,
            duration: 2,
          });
        }
        fnGetList();
      });
    },
    onCancel() {
      row.status = row.status === '1' ? '0' : '1';
    },
  });
}

/**
 * 任务立即执行一次
 * @param row 任务信息对象
 */
function fnRecordRunOne(row: Record<string, string>) {
  Modal.confirm({
    title: '提示',
    content: `确定要立即执行一次 【${row.jobName}】 任务吗?`,
    onOk() {
      const key = 'runJob';
      message.loading({ content: '请稍等...', key });
      runJob(row.jobId).then(res => {
        if (res.code === 200) {
          message.success({
            content: `${row.jobName} 执行成功`,
            key,
            duration: 2,
          });
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

/**
 * 任务删除
 * @param jobId 任务编号ID
 */
function fnRecordDelete(jobId: string = '0') {
  if (jobId === '0') {
    jobId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除定时任务编号为 【${jobId}】 任务吗?`,
    onOk() {
      const key = 'delJob';
      message.loading({ content: '请稍等...', key });
      delJob(jobId).then(res => {
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

/**
 * 重置刷新队列
 */
function fnResetQueueJob() {
  Modal.confirm({
    title: '提示',
    content: `确定要重置并刷新调度任务吗?`,
    onOk() {
      const key = 'resetQueueJob';
      message.loading({ content: '请稍等...', key });
      resetQueueJob().then(res => {
        if (res.code === 200) {
          message.success({
            content: `重置成功`,
            key,
            duration: 2,
          });
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
      const key = 'exportJob';
      message.loading({ content: '请稍等...', key });
      exportJob(toRaw(queryParams)).then(res => {
        if (res.code === 200) {
          message.success({
            content: `已完成导出`,
            key,
            duration: 2,
          });
          saveAs(res.data, `job_${Date.now()}.xlsx`);
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

/**跳转任务日志页面 */
function fnJobLogView(jobId: string | number = '0') {
  router.push(`/monitor/job${MENU_PATH_INLINE}/log/${jobId}`);
}

/**查询定时任务列表 */
function fnGetList() {
  tableState.loading = true;
  listJob(toRaw(queryParams)).then(res => {
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
    getDict('sys_job_status'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysJobGroup = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.sysJobStatus = resArr[1].value;
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
        使用
        <a-typography-text code>Bull</a-typography-text>
        基于
        <a-typography-text code>Redis</a-typography-text>
        的任务队列。
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
            type="primary"
            @click.prevent="fnModalVisibleByEdit()"
            v-perms:has="['monitor:job:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
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
            @click.prevent="fnExportList()"
            v-perms:has="['monitor:job:export']"
          >
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
          <a-button
            type="default"
            @click.prevent="fnJobLogView()"
            v-perms:has="['monitor:job:query']"
          >
            <template #icon><ContainerOutlined /></template>
            日志
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="fnResetQueueJob"
            v-perms:has="['monitor:job:remove']"
          >
            <template #icon><SyncOutlined /></template>
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
          onChange: fnTableSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'status'">
            <a-switch
              v-if="hasPermissions(['monitor:job:changeStatus'])"
              v-model:checked="record.status"
              checked-value="1"
              checked-children="正常"
              un-checked-value="0"
              un-checked-children="暂停"
              size="small"
              @change="fnRecordStatus(record)"
            />
            <DictTag
              v-else
              :options="dict.sysJobStatus"
              :value="record.status"
            />
          </template>
          <template v-if="column.key === 'jobId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.jobId)"
                  v-perms:has="['monitor:job:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.jobId)"
                  v-perms:has="['monitor:job:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.jobId)"
                  v-perms:has="['monitor:job:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>执行一次</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordRunOne(record)"
                  v-perms:has="['monitor:job:changeStatus']"
                >
                  <template #icon><RocketOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>任务日志</template>
                <a-button
                  type="link"
                  @click.prevent="fnJobLogView(record.jobId)"
                  v-perms:has="['monitor:job:log']"
                >
                  <template #icon><ContainerOutlined /></template>
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
            <a-form-item label="任务名称" name="jobName">
              {{ modalState.from.jobName }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="出错策略" name="misfirePolicy">
              {{
                ['立即执行', '执行一次', '放弃执行'][
                  +modalState.from.misfirePolicy - 1
                ]
              }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="是否并发" name="concurrent">
              {{ ['禁止', '允许'][+modalState.from.concurrent] }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="invokeTarget">
              {{ modalState.from.invokeTarget }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <DictTag
                :options="dict.sysJobGroup"
                :value="modalState.from.jobGroup"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="任务状态" name="status">
              {{ ['暂停', '正常'][+modalState.from.status] }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="cron表达式" name="cronExpression">
              <a-tag color="default">{{
                modalState.from.cronExpression
              }}</a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+modalState.from.createTime > 0">
                {{ parseDateToStr(+modalState.from.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="传入参数" name="targetParams">
          {{ modalState.from.targetParams }}
        </a-form-item>

        <a-form-item label="备注说明" name="remark">
          {{ modalState.from.remark }}
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="fnModalCancel">关闭</a-button>
      </template>
    </a-modal>

    <!-- 新增框或修改框 -->
    <a-modal
      width="800px"
      :keyboard="false"
      :mask-closable="false"
      :visible="modalState.visibleByEdit"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="fnModalOk"
      @cancel="fnModalCancel"
    >
      <a-form name="modalStateFrom" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="任务名称"
              name="jobName"
              v-bind="modalStateFrom.validateInfos.jobName"
            >
              <a-input
                v-model:value="modalState.from.jobName"
                allow-clear
                placeholder="请输入任务名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="执行策略" name="misfirePolicy">
              <a-select
                :disabled="true"
                v-model:value="modalState.from.misfirePolicy"
                default-value="3"
                placeholder="出错策略"
              >
                <a-select-option key="1" value="1">立即执行</a-select-option>
                <a-select-option key="2" value="2">执行一次</a-select-option>
                <a-select-option key="3" value="3">放弃执行</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="是否并发" name="concurrent">
              <a-select
                :disabled="true"
                v-model:value="modalState.from.concurrent"
                default-value="0"
                placeholder="是否并发"
              >
                <a-select-option key="1" value="1">允许</a-select-option>
                <a-select-option key="0" value="0">禁止</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="调用目标"
              name="invokeTarget"
              v-bind="modalStateFrom.validateInfos.invokeTarget"
            >
              <a-input
                v-model:value="modalState.from.invokeTarget"
                allow-clear
                placeholder="请输入调用目标"
              >
                <template #prefix>
                  <a-tooltip placement="topLeft">
                    <template #title>
                      <div>
                        Processor调用示例：test <br />
                        定义任务处理器示例：src\modules\monitor\processor <br />
                        参数说明：支持预设传入参数，在处理器中进行序列化处理参数
                      </div>
                    </template>
                    <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <a-select
                v-model:value="modalState.from.jobGroup"
                default-value="DEFAULT"
                placeholder="任务组名"
                :options="dict.sysJobGroup"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="任务状态" name="status">
              <a-select
                v-model:value="modalState.from.status"
                default-value="0"
                placeholder="任务状态"
                :options="dict.sysJobStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="cron表达式"
          name="cronExpression"
          :label-col="{ span: 4 }"
          v-bind="modalStateFrom.validateInfos.cronExpression"
        >
          <a-input
            v-model:value="modalState.from.cronExpression"
            allow-clear
            placeholder="请输入或生成cron执行表达式"
          >
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    表达式示例：0/20 * * * * ? <br />
                    示例说明：每20秒执行任务
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
            <template #addonAfter>
              <a-button
                type="text"
                size="small"
                @click.prevent="fnModalCron(true)"
              >
                <template #icon><FieldTimeOutlined /></template>
                生成表达式
              </a-button>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="传入参数"
          name="targetParams"
          :label-col="{ span: 4 }"
        >
          <a-textarea
            v-model:value="modalState.from.targetParams"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="400"
            placeholder="调用目标传入参数，仅支持json字符串"
          />
        </a-form-item>

        <a-form-item label="备注说明" name="remark" :label-col="{ span: 4 }">
          <a-textarea
            v-model:value="modalState.from.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="400"
            :show-count="true"
            placeholder="可输入任务说明"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 生成cron表达式 -->
    <CronModal
      v-model:visible="modalState.visibleByCron"
      :cron="modalState.from.cronExpression"
      @ok="fnModalCron(false, $event)"
    ></CronModal>
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
