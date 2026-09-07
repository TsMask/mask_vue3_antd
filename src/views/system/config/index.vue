<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import {
  exportConfig,
  listConfig,
  getConfig,
  delConfig,
  addConfig,
  updateConfig,
  refreshConfig,
} from '@/api/system/config';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import { useModalForm } from '@/hooks/useModalForm';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysConfigGroup: 'sys_config_group',
    configValueType: [
      { label: '字符', value: 'string' },
      { label: '数字', value: 'number' },
      { label: '布尔', value: 'bool' },
      { label: 'JSON', value: 'json' },
    ],
  },
});

/** 列表数据查询 */
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
  rowSelection,
  selectedRowKeys,
  removeSelectedRowKeys,
} = useProTable({
  queryFn: listConfig,
  defaultPageSize: 20,
  rowKey: 'id',
});

/** 表单弹窗管理（单弹窗 + 模式驱动） */
const {
  modal: modalState,
  formCtl: modalStateForm,
  isView,
  openModal,
  closeModal: handleCancel,
} = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined,
    config_name: '',
    config_key: '',
    config_value: '',
    config_value_type: 'string',
    config_group: '',
    config_sort: 0,
    config_status: '1',
    remark: undefined as string | undefined,
  }),
  rules: {
    config_name: [
      { required: true, min: 1, max: 50, message: '请输入参数名称' },
    ],
    config_key: [
      { required: true, min: 1, max: 50, message: '请输入参数键名' },
    ],
    config_value: [
      { required: true, min: 1, max: 50, message: '请输入参数键值' },
    ],
  },
});

/** 新增/编辑提交状态 */
const {
  confirmAction,
  executeAction,
  loading: isSubmitting,
} = useModalAction();

/** 表格字段列 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '参数编号', dataIndex: 'id', align: 'left', width: 100 },
  {
    title: '参数组',
    dataIndex: 'config_group',
    key: 'config_group',
    align: 'left',
    width: 120,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysConfigGroup),
  },
  {
    title: '参数名称',
    dataIndex: 'config_name',
    align: 'left',
    width: 200,
    ellipsis: true,
  },
  {
    title: '参数键名',
    dataIndex: 'config_key',
    align: 'left',
    width: 200,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'config_status',
    key: 'config_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 150,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '参数名称', dataIndex: 'config_name' },
  { title: '参数键名', dataIndex: 'config_key' },
  {
    title: '参数组',
    dataIndex: 'config_group',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysConfigGroup),
  },
  {
    title: '创建时间范围',
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

/** 打开参数配置详情弹窗 */
function handleView(id: string | number) {
  openModal({
    mode: 'view',
    title: '参数配置信息',
    fetchDetail: () => getConfig(id),
  });
}

/** 打开新增或编辑弹窗 */
function handleEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改参数配置',
          fetchDetail: () => getConfig(id),
        }
      : {
          mode: 'add',
          title: '添加参数配置',
        }
  );
}

/** 校验表单后提交新增/编辑 */
async function handleSubmit() {
  try {
    await modalStateForm.validate();
  } catch (e: any) {
    message.error({
      content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }
  const form = toRaw(modalState.form);
  await executeAction({
    action: () => (form.id ? updateConfig(form) : addConfig(form)),
    successText: '操作成功',
    onSuccess() {
      handleCancel();
      reload();
    },
  });
}

/** 删除参数配置（单条或批量） */
function handleDelete(id: string = '0') {
  if (id === '0') {
    id = selectedRowKeys.value.join(',');
  }
  confirmAction({
    content: `确认删除参数编号为【${id}】的数据项?`,
    action: () => delConfig(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

/** 导出参数配置列表 */
function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗',
    action: () => {
      return exportConfig({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    successText: '已导出完成',
    onSuccess: res => {
      saveAs(res.data, `config_${Date.now()}.csv`);
    },
  });
}

/** 刷新系统参数配置缓存 */
function handleRefreshConfig() {
  confirmAction({
    content: '确定要刷新参数配置缓存吗?',
    action: () => refreshConfig(),
    successText: '刷新缓存成功',
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        系统内可配置的参数变量。
      </a-typography-paragraph>
    </template>

    <!-- 表格列表 -->
    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="rowSelection"
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
          columnsStateKey: 'system-config',
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
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['system:config:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()"
            v-perms:has="['system:config:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="handleRefreshConfig"
            v-perms:has="['system:config:remove']"
          >
            <template #icon>
              <SyncOutlined />
            </template>
            刷新缓存
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:config:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'config_group'">
          <DictTag
            :options="dict.sysConfigGroup"
            :value="record.config_group"
          />
        </template>
        <template v-if="column.key === 'config_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.config_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:config:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleEdit(record.id)"
                v-perms:has="['system:config:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:config:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <!-- 详情框或新增修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="!isView"
      :mask-closable="isView"
      :open="modalState.visible"
      :title="modalState.title"
      :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        name="modalStateForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
        :disabled="isView"
      >
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="参数名称"
              name="config_name"
              v-bind="modalStateForm.validateInfos.config_name"
            >
              <a-input
                v-model:value="modalState.form.config_name"
                allow-clear
                placeholder="请输入参数名称"
                :maxlength="45"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="参数组" name="config_group">
              <a-select
                v-model:value="modalState.form.config_group"
                allow-clear
                placeholder="请选择参数组"
                :options="dict.sysConfigGroup"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="状态" name="config_status">
              <a-select
                v-model:value="modalState.form.config_status"
                default-value="1"
                placeholder="状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="排序" name="config_sort">
              <a-input-number
                v-model:value="modalState.form.config_sort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="排序值"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="参数键名"
              name="config_key"
              v-bind="modalStateForm.validateInfos.config_key"
            >
              <a-input
                v-model:value="modalState.form.config_key"
                allow-clear
                placeholder="请输入参数键名"
                :maxlength="45"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="键值类型" name="config_value_type">
              <a-select
                v-model:value="modalState.form.config_value_type"
                default-value="string"
                placeholder="键值类型"
                :options="dict.configValueType"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="参数键值"
          name="config_value"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.config_value"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="512"
            :show-count="!isView"
            placeholder="请输入参数键值"
          />
        </a-form-item>
        <a-form-item
          label="参数说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="200"
            :show-count="!isView"
            placeholder="请输入参数说明"
          />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style scoped></style>
