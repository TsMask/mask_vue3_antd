<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
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
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { getDict } = useDictStore();
const route = useRoute();
const router = useRouter();
const routePath = route.path;

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**任务组名 */
  sysJobGroup: DictType[];
  /**任务状态 */
  sysJobStatus: DictType[];
  /**任务记录日志 */
  sysJobSaveLog: DictType[];
} = reactive({
  sysJobGroup: [],
  sysJobStatus: [],
  sysJobSaveLog: [],
});

/**查询参数 */
let queryParams = reactive({
  /**任务名称 */
  jobName: '',
  /**任务组名 */
  jobGroup: undefined,
  /**任务状态 */
  statusFlag: undefined,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  Object.assign(queryParams, {
    jobName: '',
    jobGroup: undefined,
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
    align: 'left',
    width: 100,
  },
  {
    title: '任务名称',
    dataIndex: 'jobName',
    align: 'left',
    width: 200,
  },
  {
    title: '任务组名',
    dataIndex: 'jobGroup',
    key: 'jobGroup',
    align: 'left',
    width: 100,
  },
  {
    title: '调用目标',
    dataIndex: 'invokeTarget',
    align: 'left',
    width: 150,
  },
  {
    title: 'cron表达式',
    dataIndex: 'cronExpression',
    align: 'left',
    width: 150,
  },
  {
    title: '状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '记录日志',
    dataIndex: 'saveLog',
    key: 'saveLog',
    align: 'left',
    width: 100,
  },
  {
    title: '操作',
    key: 'jobId',
    align: 'left',
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
  /**新增框或修改框是否显示 */
  visibleByEdit: boolean;
  /**标题 */
  title: string;
  /**表单数据 */
  form: Record<string, any>;
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
  form: {
    jobId: undefined,
    jobName: '',
    invokeTarget: '',
    cronExpression: '',
    misfirePolicy: '3',
    concurrent: '0',
    jobGroup: 'DEFAULT',
    statusFlag: '0',
    saveLog: '0',
    targetParams: '',
    remark: '',
  },
  confirmLoading: false,
  visibleByCron: false,
});

/**对话框内表单属性和校验规则 */
const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    jobName: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入任务名称，限2-40个字符',
      },
    ],
    invokeTarget: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入调用目标，限2-40个字符',
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
  getJob(jobId)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        Object.assign(modalState.form, res.data);
        modalState.title = '任务信息';
        modalState.visibleByView = true;
      } else {
        message.error(`获取任务信息失败`, 2);
      }
    })
    .finally(() => {
      hide();
      modalState.confirmLoading = false;
    });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param jobId 任务id, 不传为新增
 */
function fnModalVisibleByEdit(jobId?: string | number) {
  if (!jobId) {
    modalStateForm.resetFields();
    modalState.title = '添加任务';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    modalState.confirmLoading = true;
    const hide = message.loading('正在打开...', 0);
    getJob(jobId)
      .then(res => {
        if (res.code === RESULT_CODE_SUCCESS && res.data) {
          Object.assign(modalState.form, res.data);
          modalState.title = '修改任务';
          modalState.visibleByEdit = true;
        } else {
          message.error(`获取任务信息失败`, 2);
        }
      })
      .finally(() => {
        hide();
        modalState.confirmLoading = false;
      });
  }
}

/**
 * 对话框弹出确认执行函数
 * 进行表达规则校验
 */
function fnModalOk() {
  modalStateForm
    .validate()
    .then(() => {
      const hide = message.loading('请稍等...', 0);
      modalState.confirmLoading = true;
      const form = toRaw(modalState.form);
      const job = form.jobId ? updateJob(form) : addJob(form);
      job
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${modalState.title}成功`,
              duration: 3,
            });
            fnGetList(1);
            fnModalCancel();
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
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
  modalStateForm.resetFields();
}

/**
 * 对话框弹出cron生成回调
 */
function fnModalCron(opt: boolean, cronStr?: string) {
  modalState.visibleByCron = opt;
  if (cronStr) {
    modalState.form.cronExpression = cronStr;
  }
}

/**
 * 任务状态修改
 * @param row 任务信息对象
 */
function fnRecordStatus(row: Record<string, string>) {
  const text =
    row.status === '1'
      ? dict.sysJobStatus[0].label
      : dict.sysJobStatus[1].label;
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.jobName} 任务吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      changeJobStatus(row.jobId, row.statusFlag)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${row.jobName} ${text}成功`,
              duration: 3,
            });
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
          fnGetList();
        })
        .finally(() => {
          hide();
        });
    },
    onCancel() {
      row.statusFlag = row.statusFlag === '1' ? '0' : '1';
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
      const hide = message.loading('请稍等...', 0);
      runJob(row.jobId)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${row.jobName} 执行成功`,
              duration: 3,
            });
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
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
      const hide = message.loading('请稍等...', 0);
      delJob(jobId)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `删除成功`,
              duration: 3,
            });
            fnGetList();
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
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
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      resetQueueJob()
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `重置成功`,
              duration: 3,
            });
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
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
      const hide = message.loading('请稍等...', 0);
      exportJob(toRaw(queryParams))
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `已完成导出`,
              duration: 3,
            });
            saveAs(res.data, `job_${Date.now()}.xlsx`);
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
        });
    },
  });
}

/**跳转任务日志页面 */
function fnJobLogView(jobId: string | number = '0') {
  router.push(`${routePath}${MENU_PATH_INLINE}/log/${jobId}`);
}

/**查询定时任务列表, pageNum初始页数 */
function fnGetList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  listJob(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      // 取消勾选
      if (tableState.selectedRowKeys.length > 0) {
        tableState.selectedRowKeys = [];
      }
      const { total, rows } = res.data;
      tablePagination.total = total;
      tableState.data = rows;
      tableState.loading = false;
    }
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([
    getDict('sys_job_group'),
    getDict('sys_job_status'),
    getDict('sys_job_save_log'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysJobGroup = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.sysJobStatus = resArr[1].value;
    }
    if (resArr[2].status === 'fulfilled') {
      dict.sysJobSaveLog = resArr[2].value;
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
        <a-typography-text code>Nodejs</a-typography-text>
        使用
        <a-typography-text code>Bull</a-typography-text>
        基于
        <a-typography-text code>Redis</a-typography-text>
        的任务队列。
        <a-typography-text code>Golang</a-typography-text>
        使用
        <a-typography-text code>Cron</a-typography-text>
        定时任务管理。
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
                placeholder="请选择任务组名"
                :options="dict.sysJobGroup"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="任务状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
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
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="显"
              un-checked-children="隐"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch
              v-model:checked="tableState.striped"
              checked-children="开"
              un-checked-children="关"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fnGetList()">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
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
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: fnTableSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobGroup'">
            <DictTag :options="dict.sysJobGroup" :value="record.jobGroup" />
          </template>
          <template v-if="column.key === 'statusFlag'">
            <a-switch
              v-if="
                dict.sysJobStatus.length > 0 &&
                hasPermissions(['monitor:job:changeStatus'])
              "
              v-model:checked="record.statusFlag"
              checked-value="1"
              :checked-children="dict.sysJobStatus[0].label"
              un-checked-value="0"
              :un-checked-children="dict.sysJobStatus[1].label"
              size="small"
              @change="fnRecordStatus(record)"
            />
            <DictTag
              v-else
              :options="dict.sysJobStatus"
              :value="record.statusFlag"
            />
          </template>
          <template v-if="column.key === 'saveLog'">
            <DictTag :options="dict.sysJobSaveLog" :value="record.saveLog" />
          </template>
          <template v-if="column.key === 'jobId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.jobId)"
                  v-perms:has="['monitor:job:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.jobId)"
                  v-perms:has="['monitor:job:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.jobId)"
                  v-perms:has="['monitor:job:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>执行一次</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordRunOne(record)"
                  v-perms:has="['monitor:job:changeStatus']"
                >
                  <template #icon><RocketOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
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
    <ProModal
      :drag="true"
      :width="800"
      :visible="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务名称" name="jobName">
              {{ modalState.form.jobName }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="出错策略" name="misfirePolicy">
              {{
                ['立即执行', '执行一次', '放弃执行'][
                  +modalState.form.misfirePolicy - 1
                ]
              }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="是否并发" name="concurrent">
              {{ ['禁止', '允许'][+modalState.form.concurrent] }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="调用目标" name="invokeTarget">
              {{ modalState.form.invokeTarget }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <DictTag
                :options="dict.sysJobGroup"
                :value="modalState.form.jobGroup"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务状态" name="status">
              {{ ['暂停', '正常'][+modalState.form.status] }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录日志" name="saveLog">
              <DictTag
                :options="dict.sysJobSaveLog"
                :value="modalState.form.saveLog"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="cron表达式" name="cronExpression">
              <a-tag color="default">
                {{ modalState.form.cronExpression }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+modalState.form.createTime > 0">
                {{ parseDateToStr(+modalState.form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="传入参数"
          name="targetParams"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="modalState.form.targetParams"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>

        <a-form-item
          label="备注说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="fnModalCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="false"
      :mask-closable="false"
      :visible="modalState.visibleByEdit"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="fnModalOk"
      @cancel="fnModalCancel"
    >
      <a-form
        name="modalStateForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="任务名称"
              name="jobName"
              v-bind="modalStateForm.validateInfos.jobName"
            >
              <a-input
                v-model:value="modalState.form.jobName"
                allow-clear
                placeholder="请输入任务名称"
                :maxlength="40"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="出错策略" name="misfirePolicy">
              <a-select
                :disabled="true"
                v-model:value="modalState.form.misfirePolicy"
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
                v-model:value="modalState.form.concurrent"
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
              v-bind="modalStateForm.validateInfos.invokeTarget"
            >
              <a-input
                v-model:value="modalState.form.invokeTarget"
                allow-clear
                placeholder="请输入调用目标"
                :maxlength="40"
              >
                <template #prefix>
                  <a-tooltip placement="topLeft">
                    <template #title>
                      <div>
                        Processor调用示例：simple <br />
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
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务组名" name="jobGroup">
              <a-select
                v-model:value="modalState.form.jobGroup"
                default-value="DEFAULT"
                placeholder="任务组名"
                :options="dict.sysJobGroup"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="任务状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="任务状态"
                :options="dict.sysJobStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="记录日志" name="saveLog">
              <a-select
                v-model:value="modalState.form.saveLog"
                default-value="0"
                placeholder="记录日志"
                :options="dict.sysJobSaveLog"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="cron表达式"
          name="cronExpression"
          v-bind="modalStateForm.validateInfos.cronExpression"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-input
            v-model:value="modalState.form.cronExpression"
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
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.targetParams"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="480"
            placeholder="调用目标传入参数，仅支持json字符串"
          />
        </a-form-item>

        <a-form-item
          label="备注说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="480"
            :show-count="true"
            placeholder="可输入任务说明"
          />
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 生成cron表达式 -->
    <CronModal
      v-model:visible="modalState.visibleByCron"
      :cron="modalState.form.cronExpression"
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
