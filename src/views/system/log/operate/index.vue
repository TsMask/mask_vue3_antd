<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import {
  exportSysLogOperate,
  listSysLogOperate,
  cleanSysLogOperate,
} from '@/api/system/log/operate';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';
import { confirmAction } from '@/hooks/useAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

const { dict } = useDictSetup({
  keyMap: {
    sysBusinessType: 'sys_operate_type',
    sysSuccessFail: 'sys_success_fail',
  },
});

const {
  dataSource,
  loading,
  pagination,
  current,
  pageSize,
  searchValues,
  onSearch,
  onReset,
  onTableChange,
  reload,
} = useProTable({
  queryFn: listSysLogOperate,
  defaultPageSize: 20,
});

const tableColumns = computed<ProColumns[]>(() => [
  { title: '日志编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '系统模块', dataIndex: 'title', align: 'left', width: 150 },
  {
    title: '操作类型',
    dataIndex: 'operate_type',
    key: 'operate_type',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysBusinessType),
  },
  { title: '操作人员', dataIndex: 'create_by', align: 'left', width: 100 },
  { title: '操作地址', dataIndex: 'operate_ip', align: 'left', width: 150 },
  {
    title: '操作状态',
    dataIndex: 'operate_status',
    key: 'operate_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '操作时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 150,
    sorter: true,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  { title: '操作', key: 'operation', align: 'left', width: 130 },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '系统模块', dataIndex: 'title' },
  {
    title: '操作类型',
    dataIndex: 'operate_type',
    valueType: 'select',
    fieldProps: { mode: 'multiple', placeholder: '请选择操作类型' },
    valueEnum: toProValueEnum(dict.sysBusinessType),
    searchTransform(value: string[]) {
      return { operate_type: value.join(',') };
    },
  },
  { title: '操作人员', dataIndex: 'create_by' },
  { title: '操作地址', dataIndex: 'operate_ip' },
  {
    title: '操作状态',
    dataIndex: 'operate_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysSuccessFail),
  },
  {
    title: '操作时间范围',
    dataIndex: 'create_time',
    valueType: 'dateTimeRange',
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        create_time_begin: value?.[0]?.valueOf(),
        create_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

/** 详情弹窗状态 */
const visibleByView = ref(false);
const detailForm = ref<Record<string, any>>({});

/** 打开详情弹窗 */
function handleView(row: Record<string, any>) {
  if (row.operate_param) {
    try {
      row.operate_param = JSON.stringify(
        JSON.parse(row.operate_param),
        null,
        2
      );
    } catch {
      // 非 JSON 格式保持原样
    }
  }
  if (row.operate_msg) {
    try {
      row.operate_msg = JSON.stringify(JSON.parse(row.operate_msg), null, 2);
    } catch {
      // 非 JSON 格式保持原样
    }
  }
  detailForm.value = row;
  visibleByView.value = true;
}

function handleCleanList() {
  confirmAction({
    content: '确认清空所有操作日志数据项?',
    action: () => cleanSysLogOperate(),
    variables: undefined as any,
    successText: '清空成功',
  });
}

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () => {
      return exportSysLogOperate({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    variables: undefined as any,
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `sys_log_operate_${Date.now()}.csv`);
    },
  });
}
</script>
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        对接口请求进行日志收集，统计高频接口分析优化等操作。
      </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @change="onTableChange"
      :scroll="tableScroll"
      :search="{
        columns: searchColumns,
        labelWidth: 100,
        labelWrap: true,
        onSearch,
        onReset,
      }"
      :toolbar="{
        setting: {
          columnsStateKey: 'system-log-operate',
          columnsStateType: 'local',
        },
        onReload: reload,
      }"
    >
      <template #toolBarRender>
        <a-space
          :size="8"
          align="center"
          :style="{ flexWrap: 'wrap', marginBottom: '8px' }"
        >
          <a-button
            type="dashed"
            danger
            @click.prevent="handleCleanList()"
            v-perms:has="['system:log:operate:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:log:operate:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'operate_type'">
          <DictTag
            :options="dict.sysBusinessType"
            :value="record.operate_type"
          />
        </template>
        <template v-if="column.key === 'operate_status'">
          <DictTag
            :options="dict.sysSuccessFail"
            :value="record.operate_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record)"
                v-perms:has="['system:log:operate:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
                详情
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <!-- 详情框 -->
    <ProModal
      :drag="true"
      :width="800"
      :open="visibleByView"
      :title="'操作日志信息'"
      @cancel="visibleByView = false"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="日志编号" name="id">
              {{ detailForm.id }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="执行状态" name="operate_status">
              <a-tag :color="+detailForm.operate_status ? 'success' : 'error'">
                {{ ['失败', '正常'][+detailForm.operate_status] }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="业务类型" name="operate_type">
              {{ detailForm.title }} /
              <DictTag
                :options="dict.sysBusinessType"
                :value="detailForm.operate_type"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作人员" name="create_by">
              {{ detailForm.create_by }} / {{ detailForm.operate_ip }} /
              {{ detailForm.operate_location }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求地址" name="operate_url">
              {{ detailForm.operate_method }}
              {{ detailForm.operate_url }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作时间" name="create_time">
              <span v-if="+detailForm.create_time > 0">
                {{ parseDateToStr(+detailForm.create_time) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="请求耗时" name="operate_cost_time">
              {{ detailForm.operate_cost_time }} ms
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="操作方法" name="operate_function">
              {{ detailForm.operate_function }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="请求参数"
          name="operate_param"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="detailForm.operate_param"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="请求参数"
            :disabled="true"
          />
        </a-form-item>
        <a-form-item
          label="操作信息"
          name="operate_msg"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="detailForm.operate_msg"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="操作信息"
            :disabled="true"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="visibleByView = false">关闭</a-button>
      </template>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
