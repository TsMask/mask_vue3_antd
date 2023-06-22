<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from '@ant-design-vue/pro-layout';
import { message, Modal } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import {
  exportLogininfor,
  listLogininfor,
  delLogininfor,
  cleanLogininfor,
  unlockLogininfor,
} from '@/api/monitor/logininfor';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
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
let queryRangePicker = ref<[string, string]>(['', '']);

/**查询参数 */
let queryParams = reactive({
  /**登录地址 */
  ipaddr: '',
  /**用户名称 */
  userName: '',
  /**登录状态 */
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
    ipaddr: '',
    userName: '',
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
  /**勾选单个的用户名称 */
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
    dataIndex: 'infoId',
    align: 'center',
  },
  {
    title: '用户名称',
    dataIndex: 'userName',
    align: 'center',
  },
  {
    title: '登录地址',
    dataIndex: 'ipaddr',
    align: 'center',
  },
  {
    title: '登录地点',
    dataIndex: 'loginLocation',
    align: 'center',
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    align: 'center',
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    align: 'center',
  },
  {
    title: '登录状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '登录信息',
    dataIndex: 'msg',
    align: 'center',
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    align: 'center',
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

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number) {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**表格多选 */
function fnTableSelectedRows(
  _: (string | number)[],
  rows: Record<string, string>[]
) {
  tableState.selectedRowKeys = rows.map(item => item.infoId);
  // 针对单个用户名称解锁
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
      delLogininfor(ids).then(res => {
        hide();
        if (res.code === 200) {
          message.success({
            content: `删除成功`,
            duration: 3,
          });
        } else {
          message.error({
            content: `${res.msg}`,
            duration: 3,
          });
        }
        fnGetList();
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
      cleanLogininfor().then(res => {
        hide();
        if (res.code === 200) {
          message.success({
            content: `清空成功`,
            duration: 3,
          });
        } else {
          message.error({
            content: `${res.msg}`,
            duration: 3,
          });
        }
        fnGetList();
      });
    },
  });
}

/**用户名称账号解锁 */
function fnUnlock() {
  const username = tableState.selectedUserName;
  Modal.confirm({
    title: '提示',
    content: `确认解锁用户 【${username}】 数据项?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      unlockLogininfor(username).then(res => {
        hide();
        if (res.code === 200) {
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
      const key = 'exportLogininfor';
      message.loading({ content: '请稍等...', key });
      exportLogininfor(toRaw(queryParams)).then(res => {
        if (res.code === 200) {
          message.success({
            content: `已完成导出`,
            key,
            duration: 2,
          });
          saveAs(res.data, `logininfor_${Date.now()}.xlsx`);
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
  queryParams.beginTime = queryRangePicker.value[0];
  queryParams.endTime = queryRangePicker.value[1];
  listLogininfor(toRaw(queryParams)).then(res => {
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
        可对用户名称账号进行解锁。
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
            <a-form-item label="登录地址" name="ipaddr">
              <a-input
                v-model:value="queryParams.ipaddr"
                allow-clear
                :maxlength="128"
                placeholder="请输入登录地址"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="用户名称" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                :maxlength="30"
                placeholder="请输入用户名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录状态" name="status">
              <a-select
                v-model:value="queryParams.status"
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
                allow-clear
                bordered
                value-format="YYYY-MM-DD"
                :placeholder="['登录开始', '登录结束']"
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
            type="primary"
            :disabled="!tableState.selectedUserName"
            @click.prevent="fnUnlock()"
            v-perms:has="['monitor:logininfor:unlock']"
          >
            <template #icon><UnlockOutlined /></template>
            解锁
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['monitor:logininfor:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="fnCleanList()"
            v-perms:has="['monitor:logininfor:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['monitor:logininfor:export']"
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
        row-key="infoId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{ x: true }"
        :pagination="tablePagination"
        :row-selection="{
          type: 'checkbox',
          onChange: fnTableSelectedRows,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <DictTag :options="dict.sysCommonStatus" :value="record.status" />
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
