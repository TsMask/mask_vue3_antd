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
  InfoCircleOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw, nextTick } from 'vue';
import { message, Modal, Form } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import {
  addMenu,
  delMenu,
  getMenu,
  listMenu,
  updateMenu,
} from '@/api/system/menu';
import { parseDateToStr } from '@/utils/DateUtils';
import useDictStore from '@/store/modules/dict';
import { parseDataToTree, parseDataToTreeExclude } from '@/utils/ParseUtils';
const { getDict } = useDictStore();
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**菜单侧边栏显示状态 */
  syShowHide: DictType[];
  /**菜单状态 */
  sysNormalDisable: DictType[];
} = reactive({
  syShowHide: [],
  sysNormalDisable: [],
});

/**查询参数 */
let queryParams = reactive({
  /**菜单名称 */
  menuName: undefined,
  /**状态 */
  status: undefined,
});

/**查询参数重置 */
function fnQueryReset() {
  queryParams = Object.assign(queryParams, {
    menuName: '',
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
  expandedRowAll: false,
  expandedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '菜单名称',
    dataIndex: 'menuName',
    align: 'center',
  },
  {
    title: '菜单编号',
    dataIndex: 'menuId',
    align: 'center',
  },
  {
    title: '图标',
    dataIndex: 'icon',
    align: 'center',
    width: '100px',
  },
  {
    title: '排序',
    dataIndex: 'orderNum',
    align: 'center',
    width: '60px',
  },
  {
    title: '所属部门',
    dataIndex: 'deptName',
    align: 'center',
  },
  {
    title: '权限标识',
    dataIndex: 'perms',
    align: 'center',
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: '80px',
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
    key: 'menuId',
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

/**初始上级菜单选择树 */
let treeDataAll: Record<string, any>[] = [];

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
  /**上级菜单选择树 */
  treeData: Record<string, any>[];
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '菜单',
  from: {
    menuId: undefined,
    menuName: '',
    menuSort: 0,
    menuType: 'M',
    parentId: '0',
    component: '',
    icon: '',
    path: '',
    perms: '',
    isFrame: '1',
    isCache: '0',
    visible: '0',
    status: '0',
    createTime: '0',
  },
  confirmLoading: false,
  treeData: [],
});

/**对话框内表单属性和校验规则 */
const modalStateFrom = Form.useForm(
  modalState.from,
  reactive({
    parentId: [{ required: true, message: '上级菜单不能为空' }],
    menuName: [
      { required: true, min: 1, max: 30, message: '请正确输入菜单名称' },
    ],
    path: [{ required: true, min: 1, max: 50, message: '请正确输入路由地址' }],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param menuId 菜单编号id
 */
function fnModalVisibleByVive(menuId: string | number) {
  if (!menuId) {
    message.error(`菜单记录存在错误`, 1.5);
    return;
  }
  modalState.treeData = treeDataAll;
  getMenu(menuId).then(res => {
    if (res.code === 200) {
      modalState.from = Object.assign(modalState.from, res.data);
      modalState.title = '菜单信息';
      modalState.visibleByView = true;
    } else {
      message.error(`获取菜单信息失败`, 1.5);
    }
  });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param menuId 菜单编号id, 不传为新增
 * @param parentId 上级菜单id
 */
function fnModalVisibleByEdit(
  menuId?: string | number,
  parentId?: string | number
) {
  modalState.treeData = treeDataAll;
  if (!menuId) {
    modalStateFrom.resetFields();
    if (parentId) {
      modalState.from.parentId = parentId;
    }
    modalState.title = '添加菜单信息';
    modalState.visibleByEdit = true;
  } else {
    getMenu(menuId).then(res => {
      if (res.code === 200) {
        modalState.from = Object.assign(modalState.from, res.data);
        modalState.title = '修改菜单信息';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取菜单信息失败`, 1.5);
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
      const menu = from.menuId ? updateMenu(from) : addMenu(from);
      menu
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
 * 菜单删除
 * @param menuId 菜单编号id
 */
function fnRecordDelete(menuId: string | number) {
  Modal.confirm({
    title: '提示',
    content: `确认删除菜单编号为 【${menuId}】 的数据项?`,
    onOk() {
      delMenu(menuId).then(res => {
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

/**查询菜单列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  listMenu(toRaw(queryParams)).then(res => {
    if (res.code === 200 && Array.isArray(res.data)) {
      // 初始上级菜单和展开编号key
      if (treeDataAll.length <= 0) {
        // 解除可变副作用
        const data: Record<string, any>[] = JSON.parse(
          JSON.stringify(res.data)
        );
        // 转换树状数据
        treeDataAll = [
          {
            menuId: '0',
            menuName: '根节点',
            children: parseDataToTreeExclude(data, 'menuType', 'F', 'menuId'),
          },
        ];
        // 展开编号key
        expandedRowKeys = [...new Set(data.map(item => item.parentId))];
        fnTableExpandedRowsAll(tableState.expandedRowAll);
      }
      tableState.data = parseDataToTree(res.data, 'menuId');
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([
    getDict('sys_normal_disable'),
    getDict('sys_show_hide'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.syShowHide = resArr[1].value;
    }
  });
  // 获取列表数据
  fnGetList();
});
</script>

<template>
  <page-container :title="title">
    <template #content>
      <a-typography-paragraph>
        动态路由菜单，内嵌页面需要x/inline/xx进行分隔开
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
            <a-form-item label="菜单名称" name="menuName">
              <a-input
                v-model:value="queryParams.menuName"
                allow-clear
                placeholder="请输入菜单名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择菜单状态"
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
        row-key="menuId"
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
          <template v-if="column.key === 'menuId'">
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.menuId)"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.menuId)"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.menuId)"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>新增子菜单</template>
                <a-button
                  type="link"
                  @click.prevent="
                    fnModalVisibleByEdit(undefined, record.menuId)
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
                :tree-data="modalState.treeData"
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
            <a-form-item label="显示排序" name="orderNum">
              {{ modalState.from.orderNum }}
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
            <a-form-item label="部门编号" name="deptId">
              {{ modalState.from.deptId }}
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
        <a-form-item
          label="上级菜单"
          name="parentId"
          v-bind="modalStateFrom.validateInfos.parentId"
        >
          <a-tree-select
            v-model:value="modalState.from.parentId"
            placeholder="上级菜单"
            show-search
            tree-default-expand-all
            :tree-data="modalState.treeData"
            :field-names="{
              children: 'children',
              label: 'menuName',
              value: 'menuId',
            }"
            tree-node-label-prop="menuName"
            tree-node-filter-prop="menuName"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          >
          </a-tree-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="菜单名称"
              name="deptName"
              v-bind="modalStateFrom.validateInfos.menuName"
            >
              <a-input
                v-model:value="modalState.from.menuName"
                allow-clear
                placeholder="请输入菜单名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单排序" name="menuSort">
              <a-input-number
                v-model:value="modalState.from.menuSort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="请输入菜单排序"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="菜单类型" name="menuType">
          <a-select
            v-model:value="modalState.from.menuType"
            default-value="M"
            placeholder="菜单类型"
          >
            <a-select-option key="M" value="M">目录</a-select-option>
            <a-select-option key="C" value="C">菜单</a-select-option>
            <a-select-option key="F" value="F">按钮</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="组件路径"
          name="component"
          v-bind="modalStateFrom.validateInfos.component"
          v-if="modalState.from.menuType === 'C'"
        >
          <a-input
            v-model:value="modalState.from.component"
            allow-clear
            placeholder="请输入组件路径"
          >
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    页面组件目录 views <br />
                    访问的组件路径,如：system/user/index <br />
                    不要带 .vue 文件后缀
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>

        <a-row :gutter="16" v-if="modalState.from.menuType !== 'F'">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="菜单图标"
              name="icon"
              v-bind="modalStateFrom.validateInfos.icon"
            >
              <a-input
                v-model:value="modalState.from.icon"
                allow-clear
                placeholder="请输入菜单图标"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="路由地址"
              name="path"
              v-bind="modalStateFrom.validateInfos.path"
            >
              <a-input
                v-model:value="modalState.from.path"
                allow-clear
                placeholder="请输入路由地址"
              >
                <template #prefix>
                  <a-tooltip placement="topLeft">
                    <template #title>
                      <div>
                        访问的路由地址，如：user
                        <br />
                        1. 如网络地址需内部访问<br />则以 http(s):// 开头
                        <br />
                        2. 如网络地址需外部访问<br />则将内部地址选项设为否
                        <br />
                        3. 如内嵌子页面需要隐藏页面<br />则将显示状态选项设为隐藏并在内嵌路由地址后拼接/inline/子页面地址
                      </div>
                    </template>
                    <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-if="modalState.from.menuType !== 'F'">
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="内部地址" name="isFrame">
              <a-select
                v-model:value="modalState.from.isFrame"
                default-value="0"
                placeholder="内部地址"
              >
                <a-select-option key="0" value="0">否</a-select-option>
                <a-select-option key="1" value="1">是</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="页面缓存" name="isCache">
              <a-select
                v-model:value="modalState.from.isCache"
                default-value="0"
                placeholder="页面缓存"
              >
                <a-select-option key="0" value="0">不缓存</a-select-option>
                <a-select-option key="1" value="1">缓存</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="显示状态" name="visible">
              <a-select
                v-model:value="modalState.from.visible"
                default-value="0"
                placeholder="显示状态"
              >
                <a-select-option key="0" value="0">隐藏</a-select-option>
                <a-select-option key="1" value="1">显示</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="菜单状态" name="status">
              <a-select
                v-model:value="modalState.from.status"
                default-value="0"
                placeholder="菜单状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="权限标识"
          name="perms"
          v-bind="modalStateFrom.validateInfos.perms"
          v-if="modalState.from.menuType !== 'M'"
        >
          <a-input
            v-model:value="modalState.from.perms"
            allow-clear
            placeholder="请输入权限标识"
          >
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    权限标识示例：monitor:server:query <br />
                    控制器中使用权限标识，如： <br />
                    @PreAuthorize({ hasPermissions: ['monitor:server:query'] })
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
      </a-form>
    </a-modal>
  </page-container>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}
</style>
