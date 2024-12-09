<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { Form, message, Modal } from 'ant-design-vue';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import type { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportData,
  listData,
  getData,
  delData,
  addData,
  updateData,
} from '@/api/system/dict/data';
import { getDictOption, getType } from '@/api/system/dict/type';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useTabsStore from '@/store/modules/tabs';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const tabsStore = useTabsStore();
const { parseDataDict, getDict } = useDictStore();
const route = useRoute();
const router = useRouter();

// 获取地址栏参数
const dictId = route.params && (route.params.dictId as string);

/**标签类型数据固定项 */
const tagTypeOptions = ref([
  { value: '', label: '普通文本' },
  { value: 'default', label: '默认（default）' },
  { value: 'blue ', label: '蓝色（blue）' },
  { value: 'cyan', label: '青色（cyan）' },
  { value: 'gold', label: '金色（gold）' },
  { value: 'green', label: '绿色（green）' },
  { value: 'lime', label: '亮绿（lime）' },
  { value: 'magenta', label: '紫红（magenta）' },
  { value: 'orange', label: '橘黄（orange）' },
  { value: 'pink', label: '粉色（pink）' },
  { value: 'purple', label: '紫色（purple）' },
  { value: 'red', label: '红色（red）' },
  { value: 'yellow', label: '黄色（yellow）' },
  { value: 'geekblue', label: '深蓝（geekblue）' },
  { value: 'volcano', label: '棕色（volcano）' },
  { value: 'processing', label: '进行（processing）' },
  { value: 'warning', label: '警告（warning）' },
  { value: 'error', label: '错误（error）' },
  { value: 'success', label: '成功（success）' },
]);

/**字典数据 */
let dict: {
  /**数据状态 */
  sysNormalDisable: DictType[];
  /**字典名称 */
  sysDictType: DictType[];
} = reactive({
  sysNormalDisable: [],
  sysDictType: [],
});

/**查询参数 */
let queryParams = reactive({
  /**字典名称 */
  dictType: '',
  /**数据标签 */
  dataLabel: '',
  /**数据状态 */
  statusFlag: undefined,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  if (dictId && dictId !== '0') {
    Object.assign(queryParams, {
      dataLabel: '',
      statusFlag: undefined,
      pageNum: 1,
      pageSize: 20,
    });
  } else {
    Object.assign(queryParams, {
      dictType: '',
      dataLabel: '',
      statusFlag: undefined,
      pageNum: 1,
      pageSize: 20,
    });
  }
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
    title: '数据编号',
    dataIndex: 'dataId',
    align: 'left',
    width: 100,
  },
  {
    title: '数据标签',
    dataIndex: 'dataLabel',
    align: 'left',
    width: 200,
  },
  {
    title: '数据键值',
    dataIndex: 'dataValue',
    align: 'left',
    width: 200,
  },
  {
    title: '数据排序',
    dataIndex: 'dataSort',
    align: 'left',
    width: 100,
  },
  {
    title: '数据状态',
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
    key: 'dataId',
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
  title: '字典数据',
  form: {
    dataId: undefined,
    dictType: 'sys_oper_type',
    dataLabel: '',
    dataSort: 0,
    dataValue: '',
    tagClass: '',
    tagType: '',
    remark: '',
    statusFlag: '0',
    createTime: 0,
    createBy: undefined,
  },
  confirmLoading: false,
});

/**对话框内表单属性和校验规则 */
const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    dataLabel: [
      { required: true, min: 1, max: 50, message: '请正确输入数据标签' },
    ],
    dataValue: [
      { required: true, min: 1, max: 50, message: '请正确输入数据键值' },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param row 调度日志信息对象
 */
function fnModalVisibleByVive(row: Record<string, string>) {
  Object.assign(modalState.form, row);
  modalState.title = '字典数据信息';
  modalState.visibleByView = true;
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param dataId 数据编号id, 不传为新增
 */
function fnModalVisibleByEdit(dataId?: string | number) {
  if (!dataId) {
    modalStateForm.resetFields();
    modalState.form.dictType = queryParams.dictType;
    modalState.title = '添加字典数据';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getData(dataId)
      .then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
          Object.assign(modalState.form, res.data);
          modalState.title = '修改字典数据';
          modalState.visibleByEdit = true;
        } else {
          message.error({
            content: '获取字典数据信息失败',
            duration: 3,
          });
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
      const dictData = form.dataId ? updateData(form) : addData(form);
      dictData
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
      message.error({
        content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
        duration: 3,
      });
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
 * @param dataId 字典编号
 */
function fnRecordDelete(dataId: string = '0') {
  if (dataId === '0') {
    dataId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除字典数据编号为 【${dataId}】 的数据项?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      delData(dataId)
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
      exportData(toRaw(queryParams))
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `已完成导出`,
              duration: 3,
            });
            saveAs(res.data, `dict_data_${Date.now()}.xlsx`);
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

/**关闭跳转 */
function fnClose() {
  const to = tabsStore.tabClose(route.path);
  if (to) {
    router.push(to);
  } else {
    router.back();
  }
}

/**查询字典数据列表, pageNum初始页数 */
function fnGetList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  listData(toRaw(queryParams)).then(res => {
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
  Promise.allSettled([getDict('sys_normal_disable'), getDictOption()]).then(
    resArr => {
      if (resArr[0].status === 'fulfilled') {
        dict.sysNormalDisable = resArr[0].value;
      }
      if (resArr[1].status === 'fulfilled') {
        const dicts = resArr[1].value;
        if (dicts.code === RESULT_CODE_SUCCESS) {
          dict.sysDictType = dicts.data;
        }
      }
    }
  );
  // 指定字典id列表数据
  if (dictId && dictId !== '0') {
    getType(dictId).then(res => {
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        queryParams.dictType = res.data.dictType;
        fnGetList();
      } else {
        message.error({
          content: '获取字典类型信息失败',
          duration: 3,
        });
      }
    });
  } else {
    // 获取列表数据
    fnGetList();
  }
});
</script>

<template>
  <PageContainer>
    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="字典名称" name="dictType">
              <a-select
                v-model:value="queryParams.dictType"
                :allow-clear="dictId === '0'"
                :disabled="dictId !== '0'"
                placeholder="请选择字典名称"
                :options="dict.sysDictType"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dataLabel">
              <a-input
                v-model:value="queryParams.dataLabel"
                allow-clear
                placeholder="请输入数据标签"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="数据状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
                allow-clear
                placeholder="请选择数据状态"
                :options="dict.sysNormalDisable"
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
          <a-button type="default" @click.prevent="fnClose()">
            <template #icon><CloseOutlined /></template>
            关闭
          </a-button>
          <a-button
            type="primary"
            @click.prevent="fnModalVisibleByEdit()"
            v-perms:has="['system:dict:add']"
          >
            <template #icon><PlusOutlined /></template>
            新增
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
        row-key="dataId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        :pagination="tablePagination"
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
          <template v-if="column.key === 'dataId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record)"
                  v-perms:has="['system:dict:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.dataId)"
                  v-perms:has="['system:dict:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.dataId)"
                  v-perms:has="['system:dict:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
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
      :open="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据编号" name="dataId">
              {{ modalState.form.dataId }}
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
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType">
              <a-select
                v-model:value="modalState.form.dictType"
                default-value="sys_oper_type"
                placeholder="字典类型"
                :options="dict.sysDictType"
                :disabled="true"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dataLabel">
              {{ modalState.form.dataLabel }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据键值" name="dataValue">
              {{ modalState.form.dataValue }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="标签类型" name="tagType">
              <DictTag
                :options="tagTypeOptions"
                :value="modalState.form.tagType"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="dataSort">
              {{ modalState.form.dataSort }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="样式属性" name="tagClass">
              {{ modalState.form.tagClass }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="回显预览" name="tagType">
              <DictTag
                :options="parseDataDict(modalState.form)"
                :value="modalState.form.dataValue"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="数据说明"
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
      :open="modalState.visibleByEdit"
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
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典类型" name="dictType">
              <a-select
                v-model:value="modalState.form.dictType"
                default-value="sys_oper_type"
                placeholder="字典类型"
                :options="dict.sysDictType"
                :disabled="true"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="数据状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="数据标签"
              name="dataLabel"
              v-bind="modalStateForm.validateInfos.dataLabel"
            >
              <a-input
                v-model:value="modalState.form.dataLabel"
                allow-clear
                placeholder="请输入数据标签"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="数据键值"
              name="dataValue"
              v-bind="modalStateForm.validateInfos.dataValue"
            >
              <a-input
                v-model:value="modalState.form.dataValue"
                allow-clear
                placeholder="请输入数据键值"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="标签类型" name="tagType">
              <a-select
                v-model:value="modalState.form.tagType"
                placeholder="标签类型"
                :options="tagTypeOptions"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="dataSort">
              <a-input-number
                v-model:value="modalState.form.dataSort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="请输入数据排序"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="样式属性"
          name="tagClass"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-input
            v-model:value="modalState.form.tagClass"
            allow-clear
            placeholder="请输入样式属性"
            :maxlength="50"
          ></a-input>
        </a-form-item>
        <a-form-item
          label="数据说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="480"
            :show-count="true"
            placeholder="请输入数据说明"
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
