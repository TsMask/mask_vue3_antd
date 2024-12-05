<script setup lang="ts">
import { Dayjs } from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Modal, Form } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import {
  exportType,
  listType,
  getType,
  delType,
  addType,
  updateType,
  refreshCache,
} from '@/api/system/dict/type';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
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
  /**字典状态 */
  sysNormalDisable: DictType[];
} = reactive({
  sysNormalDisable: [],
});

/**开始结束时间 */
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/**查询参数 */
let queryParams = reactive({
  /**字典名称 */
  dictName: '',
  /**字典类型 */
  dictType: '',
  /**字典状态 */
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
    dictName: '',
    dictType: '',
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
    title: '字典编号',
    dataIndex: 'dictId',
    align: 'left',
    width: 100,
  },
  {
    title: '字典名称',
    dataIndex: 'dictName',
    align: 'left',
    width: 200,
  },
  {
    title: '字典类型',
    dataIndex: 'dictType',
    align: 'left',
    width: 200,
  },
  {
    title: '字典状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'dictId',
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
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '字典类型',
  form: {
    dictId: undefined,
    dictName: '',
    dictType: undefined,
    statusFlag: '0',
    remark: undefined,
  },
  confirmLoading: false,
});

/**对话框内表单属性和校验规则 */
const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    dictName: [
      { required: true, min: 1, max: 50, message: '请正确输入字典名称' },
    ],
    dictType: [
      { required: true, min: 1, max: 50, message: '请正确输入字典类型' },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param dictId 字典编号id
 */
function fnModalVisibleByVive(dictId: string | number) {
  if (!dictId) {
    message.error(`字典类型记录存在错误`, 2);
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  getType(dictId).then(res => {
    modalState.confirmLoading = false;
    hide();
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      Object.assign(modalState.form, res.data);
      modalState.title = '字典类型信息';
      modalState.visibleByView = true;
    } else {
      message.error(`获取字典类型信息失败`, 2);
    }
  });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param dictId 字典编号id, 不传为新增
 */
function fnModalVisibleByEdit(dictId?: string | number) {
  if (!dictId) {
    modalStateForm.resetFields();
    modalState.title = '添加字典类型';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getType(dictId).then(res => {
      modalState.confirmLoading = false;
      hide();
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        Object.assign(modalState.form, res.data);
        modalState.title = '修改字典类型';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取字典类型信息失败`, 2);
      }
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
      const dictType = form.dictId ? updateType(form) : addType(form);
      dictType
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
 * 字典删除
 * @param dictId 字典编号ID
 */
function fnRecordDelete(dictId: string = '0') {
  if (dictId === '0') {
    dictId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除参数编号为 【${dictId}】 的数据项?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      delType(dictId)
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

/**列表导出 */
function fnExportList() {
  Modal.confirm({
    title: '提示',
    content: `确认根据搜索条件导出xlsx表格文件吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      exportType(toRaw(queryParams))
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `已完成导出`,
              duration: 3,
            });
            saveAs(res.data, `dict_${Date.now()}.xlsx`);
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
 * 刷新缓存
 */
function fnRefreshCache() {
  Modal.confirm({
    title: '提示',
    content: `确定要刷新字典数据缓存吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      refreshCache()
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `刷新缓存成功`,
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

/**跳转字典数据页面 */
function fnDataView(dictId: string | number = '0') {
  router.push(`${routePath}${MENU_PATH_INLINE}/data/${dictId}`);
}

/**查询参数配置列表, pageNum初始页数 */
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

  listType(toRaw(queryParams)).then(res => {
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
  Promise.allSettled([getDict('sys_normal_disable')]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
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
        数据字典类型，数据名称对应的代码值映射数据。
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
            <a-form-item label="字典名称" name="dictName">
              <a-input
                v-model:value="queryParams.dictName"
                allow-clear
                placeholder="请输入字典名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType">
              <a-input
                v-model:value="queryParams.dictType"
                allow-clear
                placeholder="请输入字典类型"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="字典状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
                allow-clear
                placeholder="请选择"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="8" :md="12" :xs="24">
            <a-form-item label="创建时间" name="queryRangePicker">
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
            @click.prevent="fnModalVisibleByEdit()"
            v-perms:has="['system:dict:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['system:dict:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="default"
            @click.prevent="fnDataView()"
            v-perms:has="['system:dict:data']"
          >
            <template #icon><ContainerOutlined /></template>
            字典数据
          </a-button>
          <a-button
            type="dashed"
            danger
            @click.prevent="fnRefreshCache"
            v-perms:has="['system:dict:remove']"
          >
            <template #icon><SyncOutlined /></template>
            刷新缓存
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['system:dict:export']"
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
        row-key="dictId"
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
          <template v-if="column.key === 'statusFlag'">
            <DictTag
              :options="dict.sysNormalDisable"
              :value="record.statusFlag"
            />
          </template>
          <template v-if="column.key === 'dictId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.dictId)"
                  v-perms:has="['system:dict:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.dictId)"
                  v-perms:has="['system:dict:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.dictId)"
                  v-perms:has="['system:dict:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>字典数据</template>
                <a-button
                  type="link"
                  @click.prevent="fnDataView(record.dictId)"
                  v-perms:has="['system:dict:data']"
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
            <a-form-item label="字典编号" name="dictId">
              {{ modalState.form.dictId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典名称" name="dictName">
              {{ modalState.form.dictName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType">
              {{ modalState.form.dictType }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="字典说明"
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
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-form-item
          label="字典名称"
          name="dictName"
          v-bind="modalStateForm.validateInfos.dictName"
        >
          <a-input
            v-model:value="modalState.form.dictName"
            allow-clear
            placeholder="请输入字典名称"
            :maxlength="50"
          ></a-input>
        </a-form-item>

        <a-form-item
          label="字典类型"
          name="dictType"
          v-bind="modalStateForm.validateInfos.dictType"
        >
          <a-input
            v-model:value="modalState.form.dictType"
            allow-clear
            placeholder="请输入字典类型"
            :maxlength="50"
          ></a-input>
        </a-form-item>

        <a-form-item label="字典状态" name="statusFlag">
          <a-select
            v-model:value="modalState.form.statusFlag"
            default-value="0"
            placeholder="字典状态"
            :options="dict.sysNormalDisable"
          >
          </a-select>
        </a-form-item>

        <a-form-item label="字典说明" name="remark">
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="450"
            :show-count="true"
            placeholder="请输入参数说明"
          />
        </a-form-item>
      </a-form>
    </ProModal>
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
