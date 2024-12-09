<script setup lang="ts">
import { Dayjs } from 'dayjs';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message, Modal } from 'ant-design-vue';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import type { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportSysLogLogin,
  listSysLogLogin,
  delSysLogLogin,
  cleanSysLogLogin,
  unlock,
} from '@/api/system/log/login';
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
  /**登录状态 */
  sysCommonStatus: DictType[];
} = reactive({
  sysCommonStatus: [],
});

/**开始结束时间 */
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/**查询参数 */
let queryParams = reactive({
  /**登录地址 */
  loginIp: '',
  /**登录账号 */
  userName: '',
  /**登录状态 */
  statusFlag: undefined,
  /**开始时间 */
  beginTime: undefined as undefined | number,
  /**结束时间 */
  endTime: undefined as undefined | number,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  Object.assign(queryParams, {
    loginIp: '',
    userName: '',
    statusFlag: undefined,
    beginTime: undefined,
    endTime: undefined,
    pageNum: 1,
    pageSize: 20,
  });
  queryRangePicker.value = undefined;
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
  /**勾选单个的登录账号 */
  selectedUserName: string;
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: false,
  data: [],
  selectedRowKeys: [],
  selectedUserName: '',
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '日志编号',
    dataIndex: 'id',
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
    title: '登录IP',
    dataIndex: 'loginIp',
    align: 'left',
    width: 150,
  },
  {
    title: '登录地点',
    dataIndex: 'loginLocation',
    align: 'left',
    width: 150,
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    align: 'left',
    width: 150,
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    align: 'left',
    width: 200,
  },
  {
    title: '登录状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '登录信息',
    dataIndex: 'msg',
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
function fnTableSelectedRows(
  _: (string | number)[],
  rows: Record<string, string>[]
) {
  tableState.selectedRowKeys = rows.map(item => item.loginId);
  // 针对单个登录账号解锁
  if (rows.length === 1) {
    tableState.selectedUserName = rows[0].userName;
  } else {
    tableState.selectedUserName = '';
  }
}

/**记录删除 */
function fnRecordDelete() {
  const ids = tableState.selectedRowKeys.join(',');
  Modal.confirm({
    title: '提示',
    content: `确认删除访问编号为 【${ids}】 的数据项吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      delSysLogLogin(ids)
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

/**列表清空 */
function fnCleanList() {
  Modal.confirm({
    title: '提示',
    content: `确认清空所有登录日志数据项?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      cleanSysLogLogin()
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `清空成功`,
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

/**登录账号解锁 */
function fnUnlock() {
  const username = tableState.selectedUserName;
  Modal.confirm({
    title: '提示',
    content: `确认解锁用户 【${username}】 数据项?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      unlock(username)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${username} 解锁成功`,
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
      exportSysLogLogin(toRaw(queryParams))
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `已完成导出`,
              duration: 3,
            });
            saveAs(res.data, `sys_log_login_${Date.now()}.xlsx`);
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

/**查询登录日志列表, pageNum初始页数 */
function fnGetList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }

  // 时间范围
  if (
    Array.isArray(queryRangePicker.value) &&
    queryRangePicker.value.length > 0
  ) {
    queryParams.beginTime = queryRangePicker.value[0].startOf('day').valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf('day').valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }

  listSysLogLogin(toRaw(queryParams)).then(res => {
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

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([getDict('sys_common_status')]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysCommonStatus = resArr[0].value;
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
        对登录进行日志收集，登录锁定的信息存入
        <a-typography-text code>Redis</a-typography-text>
        可对登录账号进行解锁。
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
            <a-form-item label="登录账号" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                :maxlength="30"
                placeholder="请输入登录账号"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录IP" name="loginIp">
              <a-input
                v-model:value="queryParams.loginIp"
                allow-clear
                :maxlength="128"
                placeholder="请输入登录IP"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
                allow-clear
                placeholder="请选择登录状态"
                :options="dict.sysCommonStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录时间" name="queryRangePicker">
              <a-range-picker
                v-model:value="queryRangePicker"
                :bordered="true"
                :allow-clear="true"
                style="width: 100%"
              ></a-range-picker>
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
            :disabled="!tableState.selectedUserName"
            @click.prevent="fnUnlock()"
            v-perms:has="['system:log:login:unlock']"
          >
            <template #icon><UnlockOutlined /></template>
            解锁
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['system:log:login:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="fnCleanList()"
            v-perms:has="['system:log:login:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['system:log:login:export']"
          >
            <template #icon><ExportOutlined /></template>
            导出
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
        row-key="loginId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{
          x: tableColumns.length * 160,
          scrollToFirstRowOnChange: true,
        }"
        :pagination="tablePagination"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: fnTableSelectedRows,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag
              :options="dict.sysCommonStatus"
              :value="record.statusFlag"
            />
          </template>
        </template>
      </a-table>
    </a-card>
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
