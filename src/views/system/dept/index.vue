<script setup lang="ts">
import {
  PlusOutlined,
  FormOutlined,
  ProfileOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { message, Modal, Form } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import {
  listDept,
  getDept,
  delDept,
  addDept,
  updateDept,
  listDeptExcludeChild,
} from '@/api/system/dept';
import { parseDateToStr } from '@/utils/DateUtils';
import useDictStore from '@/store/modules/dict';
import { parseDataToTree } from '@/utils/ParseUtils';
const { getDict } = useDictStore();
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**状态 */
  sysNormalDisable: DictType[];
} = reactive({
  sysNormalDisable: [],
});

/**查询参数 */
let queryParams = reactive({
  /**部门名称 */
  deptName: '',
  /**部门状态 */
  status: undefined,
});

/**查询参数重置 */
function fnQueryReset() {
  queryParams = Object.assign(queryParams, {
    deptName: '',
    status: undefined,
  });
  fnGetList();
}

/**表格全展开行key */
let expandedRowKeys: string[] = [];

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
  /**全展开 */
  expandedRowAll: boolean;
  /**展开行key */
  expandedRowKeys: (string | number)[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: false,
  data: [],
  expandedRowAll: true,
  expandedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '部门名称',
    dataIndex: 'deptName',
    align: 'center',
  },
  {
    title: '部门编号',
    dataIndex: 'deptId',
    align: 'center',
  },
  {
    title: '部门排序',
    dataIndex: 'orderNum',
    align: 'center',
  },
  {
    title: '岗位状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'center',
    customRender(opt) {
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'deptId',
    align: 'center',
  },
];

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number) {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**表格展开行key */
function fnTableExpandedRowsAll(checked: boolean | string | number) {
  tableState.expandedRowKeys = checked ? expandedRowKeys : [];
}

/**表格展开行key */
function fnTableExpandedRowsChange(expandedRows: (string | number)[]) {
  tableState.expandedRowKeys = expandedRows;
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
  /**上级部门选择树 */
  deptTreeData: Record<string, any>[];
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '部门',
  from: {
    deptId: undefined,
    deptName: '',
    email: '',
    leader: '',
    orderNum: 0,
    parentId: '100',
    ancestors: '',
    parentName: null,
    phone: '',
    status: '0',
  },
  confirmLoading: false,
  deptTreeData: [],
});

/**对话框内表单属性和校验规则 */
const modalStateFrom = Form.useForm(
  modalState.from,
  reactive({
    parentId: [{ required: true, message: '上级部门不能为空' }],
    deptName: [
      { required: true, min: 1, max: 30, message: '请正确输入部门名称' },
    ],
    email: [
      {
        required: false,
        min: 6,
        max: 50,
        type: 'email',
        message: '请输入正确的邮箱地址',
      },
    ],
    phone: [
      {
        required: false,
        min: 11,
        max: 11,
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
      },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param deptId 部门编号id
 */
function fnModalVisibleByVive(deptId: string | number) {
  if (!deptId) {
    message.error(`部门记录存在错误`, 1.5);
    return;
  }
  getDept(deptId).then(res => {
    if (res.code === 200) {
      modalState.from = Object.assign(modalState.from, res.data);
      modalState.title = '部门信息';
      modalState.visibleByView = true;
    } else {
      message.error(`获取部门信息失败`, 1.5);
    }
  });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param deptId 部门编号id, 不传为新增
 * @param parentId 上级部门id
 */
function fnModalVisibleByEdit(
  deptId?: string | number,
  parentId?: string | number
) {
  if (!deptId) {
    modalStateFrom.resetFields();
    if (parentId) {
      modalState.from.parentId = parentId;
    }
    modalState.title = '添加部门信息';
    modalState.visibleByEdit = true;
  } else {
    getDept(deptId).then(res => {
      if (res.code === 200) {
        modalState.from = Object.assign(modalState.from, res.data);
        modalState.title = '修改部门信息';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取部门信息失败`, 1.5);
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
      const dept = from.deptId ? updateDept(from) : addDept(from);
      dept
        .then(res => {
          if (res.code === 200) {
            message.success(`${modalState.title}成功`, 1.5);
            modalState.visibleByEdit = false;
            modalStateFrom.resetFields();
            fnGetList();
          } else {
            message.error(res.msg, 1.5);
          }
        })
        .finally(() => {
          modalState.confirmLoading = false;
        });
    })
    .catch(e => {
      message.error(`请正确填写 ${e.errorFields.length} 处必填信息！`, 1.5);
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
 * 部门删除
 * @param deptId 部门编号id
 */
function fnRecordDelete(deptId: string | number) {
  Modal.confirm({
    title: '提示',
    content: `确认删除部门编号为 【${deptId}】 的数据项?`,
    onOk() {
      delDept(deptId).then(res => {
        if (res.code === 200) {
          message.success(`删除成功`, 1.5);
          fnGetList();
        } else {
          message.error(`${res.msg}`, 1.5);
        }
      });
    },
  });
}

/**查询部门列表 */
function fnGetList() {
  tableState.loading = true;
  listDept(toRaw(queryParams)).then(res => {
    if (res.code === 200 && Array.isArray(res.data)) {
      tableState.data = parseDataToTree(res.data, 'deptId');
      tableState.loading = false;
    }
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([getDict('sys_normal_disable')]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
    }
  });
  // 初始上级部门和展开编号key
  listDept({}).then(res => {
    if (res.code === 200 && Array.isArray(res.data)) {
      // 转换树状数据
      modalState.deptTreeData = parseDataToTree(res.data, 'deptId');
      // 展开编号key
      expandedRowKeys = [...new Set(res.data.map(item => item.parentId))];
      fnTableExpandedRowsAll(tableState.expandedRowAll);
    }
  });
  // 获取列表数据
  fnGetList();
});
</script>

<template>
  <page-container :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户岗位标记 </a-typography-paragraph>
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
            <a-form-item label="部门名称" name="deptName">
              <a-input
                v-model:value="queryParams.deptName"
                allow-clear
                placeholder="请输入部门名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="岗位状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择"
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
          <a-button type="primary" @click.prevent="fnModalVisibleByEdit()">
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip>
            <template #title>展开/折叠</template>
            <a-switch
              v-model:checked="tableState.expandedRowAll"
              checked-children="展"
              un-checked-children="折"
              size="small"
              @change="fnTableExpandedRowsAll"
            />
          </a-tooltip>
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
        row-key="deptId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="false"
        :scroll="{ x: true }"
        children-column-name="children"
        :expanded-row-keys="tableState.expandedRowKeys"
        @expandedRowsChange="fnTableExpandedRowsChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.status" />
          </template>
          <template v-if="column.key === 'deptId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.deptId)"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.deptId)"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip v-if="record.parentId !== '0'">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.deptId)"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip v-if="record.status !== '0'">
                <template #title>新增子部门</template>
                <a-button
                  type="link"
                  @click.prevent="
                    fnModalVisibleByEdit(undefined, record.deptId)
                  "
                >
                  <template #icon><PlusOutlined /></template>
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
            <a-form-item label="上级部门" name="parentId">
              <a-tree-select
                v-model:value="modalState.from.parentId"
                placeholder="上级部门"
                disabled
                :tree-data="modalState.deptTreeData"
                :field-names="{
                  children: 'children',
                  label: 'deptName',
                  value: 'deptId',
                }"
                tree-node-label-prop="deptName"
              >
                <template #suffixIcon></template>
              </a-tree-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="部门编号" name="deptId">
              {{ modalState.from.deptId }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="部门状态" name="status">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.from.status"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示排序" name="orderNum">
              {{ modalState.from.orderNum }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="部门名称" name="deptName">
              {{ modalState.from.deptName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="负责人" name="leader">
              {{ modalState.from.leader }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="联系电话" name="phone">
              {{ modalState.from.phone }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="邮箱" name="email">
              {{ modalState.from.email }}
            </a-form-item>
          </a-col>
        </a-row>
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
              label="上级部门"
              name="parentId"
              v-bind="modalStateFrom.validateInfos.parentId"
            >
              <a-tree-select
                v-model:value="modalState.from.parentId"
                placeholder="上级部门"
                show-search
                tree-default-expand-all
                :tree-data="modalState.deptTreeData"
                :field-names="{
                  children: 'children',
                  label: 'deptName',
                  value: 'deptId',
                }"
                tree-node-label-prop="deptName"
                tree-node-filter-prop="deptName"
                style="width: 100%"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
              >
              </a-tree-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="岗位状态" name="status">
              <a-select
                v-model:value="modalState.from.status"
                default-value="0"
                placeholder="岗位状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="显示顺序" name="orderNum">
              <a-input-number
                v-model:value="modalState.from.orderNum"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="请输入显示顺序"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="部门名称"
              name="deptName"
              v-bind="modalStateFrom.validateInfos.deptName"
            >
              <a-input
                v-model:value="modalState.from.deptName"
                allow-clear
                placeholder="请输入部门名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="负责人"
              name="leader"
              v-bind="modalStateFrom.validateInfos.leader"
            >
              <a-input
                v-model:value="modalState.from.leader"
                allow-clear
                placeholder="请输入负责人名称"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="联系电话"
              name="phone"
              v-bind="modalStateFrom.validateInfos.phone"
            >
              <a-input
                v-model:value="modalState.from.phone"
                allow-clear
                placeholder="请输入负责人联系电话"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="邮箱"
              name="email"
              v-bind="modalStateFrom.validateInfos.email"
            >
              <a-input
                v-model:value="modalState.from.email"
                allow-clear
                placeholder="请输入负责人邮箱"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </page-container>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}
</style>
