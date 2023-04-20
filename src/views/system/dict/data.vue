<script setup lang="ts">
import {
  PlusOutlined,
  FormOutlined,
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
import { Form, message, Modal } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportData,
  listData,
  getData,
  delData,
  addData,
  updateData,
} from '@/api/system/dict/data';
import { getDictOptionselect, getType } from '@/api/system/dict/type';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils.js';
import useDictStore from '@/store/modules/dict';
const { getDict } = useDictStore();
const route = useRoute();
const router = useRouter();

// 获取地址栏参数
const dictId = route.params && (route.params.dictId as string);

/**数据标签回显样式 */
const listClassOptions = ref([
  { value: 'default', label: 'default' },
  { value: 'blue ', label: 'blue' },
  { value: 'cyan', label: 'cyan' },
  { value: 'gold', label: 'gold' },
  { value: 'green', label: 'green' },
  { value: 'lime', label: 'lime' },
  { value: 'magenta', label: 'magenta' },
  { value: 'orange', label: 'orange' },
  { value: 'pink', label: 'pink' },
  { value: 'purple', label: 'purple' },
  { value: 'red', label: 'red' },
  { value: 'yellow', label: 'yellow' },
  { value: 'error', label: 'error' },
  { value: 'success', label: 'success' },
  { value: 'warning', label: 'warning' },
  { value: 'processing', label: 'processing' },
  { value: 'geekblue', label: 'geekblue' },
  { value: 'volcano', label: 'volcano' },
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
  dictLabel: '',
  /**数据状态 */
  status: undefined,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  if (dictId && dictId !== '0') {
    queryParams = Object.assign(queryParams, {
      dictLabel: '',
      status: undefined,
      pageNum: 1,
      pageSize: 20,
    });
  } else {
    queryParams = Object.assign(queryParams, {
      dictType: '',
      dictLabel: '',
      status: undefined,
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
  seached: false,
  data: [],
  selectedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '数据代码',
    dataIndex: 'dictCode',
    align: 'center',
  },
  {
    title: '数据标签',
    dataIndex: 'dictLabel',
    align: 'center',
  },
  {
    title: '数据键值',
    dataIndex: 'dictValue',
    align: 'center',
  },
  {
    title: '数据排序',
    dataIndex: 'dictSort',
    align: 'center',
  },
  {
    title: '数据状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'center',
    customRender(opt) {
      if(+opt.value <= 0) return ''
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'dictCode',
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
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '字典数据',
  from: {
    dictCode: undefined,
    dictLabel: '',
    dictSort: 0,
    dictType: 'sys_oper_type',
    dictValue: '',
    isDefault: 'N',
    cssClass: '',
    listClass: 'default',
    remark: '',
    status: '0',
    createTime: '',
    createBy: undefined,
  },
  confirmLoading: false,
});

/**对话框内表单属性和校验规则 */
const modalStateFrom = Form.useForm(
  modalState.from,
  reactive({
    dictLabel: [
      { required: true, min: 1, max: 50, message: '请正确输入数据标签' },
    ],
    dictValue: [
      { required: true, min: 1, max: 50, message: '请正确输入数据键值' },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param row 调度日志信息对象
 */
function fnModalVisibleByVive(row: Record<string, string>) {
  modalState.from = Object.assign(modalState.from, row);
  modalState.title = '字典数据信息';
  modalState.visibleByView = true;
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param dictCode 数据编号id, 不传为新增
 */
function fnModalVisibleByEdit(dictCode?: string | number) {
  if (!dictCode) {
    modalStateFrom.resetFields();
    modalState.title = '添加字典数据';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getData(dictCode).then(res => {
      modalState.confirmLoading = false;
      hide();
      if (res.code === 200) {
        modalState.from = Object.assign(modalState.from, res.data);
        modalState.title = '修改字典数据';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取字典数据信息失败`, 2);
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
      const dictData = from.dictCode ? updateData(from) : addData(from);
      const key = 'dictData';
      message.loading({ content: '请稍等...', key });
      dictData
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
 * 字典删除
 * @param dictCode 字典代码
 */
function fnRecordDelete(dictCode: string = '0') {
  if (dictCode === '0') {
    dictCode = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除字典数据代码为 【${dictCode}】 的数据项?`,
    onOk() {
      const key = 'delData';
      message.loading({ content: '请稍等...', key });
      delData(dictCode).then(res => {
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
            key: key,
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
      const key = 'exportData';
      message.loading({ content: '请稍等...', key });
      exportData(toRaw(queryParams)).then(resBlob => {
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
          saveAs(resBlob, `dict_data_${Date.now()}.xlsx`);
        }
      });
    },
  });
}

/**关闭跳转 */
function fnClose() {
  // 字典管理
  router.push('/system/dict');
}

/**查询字典数据列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  listData(toRaw(queryParams)).then(res => {
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
  Promise.allSettled([
    getDict('sys_normal_disable'),
    getDictOptionselect(),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      const dicts = resArr[1].value;
      if (dicts.code === 200) {
        dict.sysDictType = dicts.data;
      }
    }
  });
  // 指定字典id列表数据
  if (dictId && dictId !== '0') {
    getType(dictId).then(res => {
      if (res.code === 200) {
        queryParams.dictType = res.data.dictType;
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
            <a-form-item label="数据标签" name="dictLabel">
              <a-input
                v-model:value="queryParams.dictLabel"
                allow-clear
                placeholder="请输入数据标签"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="数据状态" name="status">
              <a-select
                v-model:value="queryParams.status"
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
        row-key="dictCode"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :scroll="{ x: true }"
        :pagination="tablePagination"
        :row-selection="{
          type: 'checkbox',
          onChange: selectedRowKeys => fnTableSelectedRowKeys(selectedRowKeys),
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.status" />
          </template>
          <template v-if="column.key === 'dictCode'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record)"
                  v-perms:has="['system:dict:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.dictCode)"
                  v-perms:has="['system:dict:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.dictCode)"
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
    <a-modal
      width="800px"
      :visible="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典名称" name="dictType">
              {{
                dict.sysDictType.find(
                  item => item.value === modalState.from.dictType
                )?.label
              }}
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
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据代码" name="dictCode">
              {{ modalState.from.dictCode }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据状态" name="status">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.from.status"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据标签" name="dictLabel">
              {{ modalState.from.dictLabel }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据键值" name="dictValue">
              {{ modalState.from.dictValue }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="回显样式" name="listClass">
              <a-tag
                :class="modalState.from.cssClass"
                color="modalState.from.listClass"
              >
                {{
                  listClassOptions.find(
                    i => i.value === modalState.from.listClass
                  )?.label
                }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="dictSort">
              {{ modalState.from.dictSort }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="样式属性" name="cssClass">
          {{ modalState.from.cssClass }}
        </a-form-item>
        <a-form-item label="数据说明" name="remark">
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
            <a-form-item label="字典类型" name="dictType">
              <a-select
                v-model:value="modalState.from.dictType"
                default-value="sys_oper_type"
                placeholder="字典类型"
                :options="dict.sysDictType"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="字典状态" name="status">
              <a-select
                v-model:value="modalState.from.status"
                default-value="0"
                placeholder="字典状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="数据标签"
              name="dictLabel"
              v-bind="modalStateFrom.validateInfos.dictLabel"
            >
              <a-input
                v-model:value="modalState.from.dictLabel"
                allow-clear
                placeholder="请输入数据标签"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="数据键值"
              name="dictValue"
              v-bind="modalStateFrom.validateInfos.dictValue"
            >
              <a-input
                v-model:value="modalState.from.dictValue"
                allow-clear
                placeholder="请输入数据键值"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="回显样式" name="listClass">
              <a-select
                v-model:value="modalState.from.listClass"
                default-value="default"
                placeholder="回显样式"
                :options="listClassOptions"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="数据排序" name="dictSort">
              <a-input
                v-model:value="modalState.from.dictSort"
                allow-clear
                placeholder="请输入数据排序"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="样式属性" name="cssClass">
          <a-input
            v-model:value="modalState.from.cssClass"
            allow-clear
            placeholder="请输入样式属性"
          ></a-input>
        </a-form-item>
        <a-form-item label="数据说明" name="remark">
          <a-textarea
            v-model:value="modalState.from.remark"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="450"
            :show-count="true"
            placeholder="请输入数据说明"
          />
        </a-form-item>
      </a-form>
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
