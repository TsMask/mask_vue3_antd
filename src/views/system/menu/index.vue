<script setup lang="ts">
import { PageContainer } from '@ant-design-vue/pro-layout';
import { message, Modal, Form } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import IconFont from '@/components/IconFont/index.vue';
import { iconFonts } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import {
  addMenu,
  delMenu,
  getMenu,
  listMenu,
  updateMenu,
} from '@/api/system/menu';
import {
  parseDataToTree,
  parseDataToTreeExclude,
} from '@/utils/parse-tree-utils';
import { parseDateToStr } from '@/utils/date-utils';
import {
  MENU_PATH_INLINE,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
  MENU_TYPE_BUTTON,
} from '@/constants/menu-constants';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { getDict } = useDictStore();
const route = useRoute();

/**字体图标可选择数据 */
let icons = reactive(iconFonts.map(item => ({ value: item, label: item })));

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**菜单状态 */
  sysNormalDisable: DictType[];
} = reactive({
  sysNormalDisable: [],
});

/**查询参数 */
let queryParams = reactive({
  /**菜单名称 */
  menuName: '',
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
    align: 'left',
    width: 200,
  },
  {
    title: '菜单编号',
    dataIndex: 'menuId',
    align: 'left',
    width: 100,
  },
  {
    title: '菜单排序',
    dataIndex: 'menuSort',
    align: 'left',
    width: 100,
  },
  {
    title: '菜单图标',
    dataIndex: 'icon',
    key: 'icon',
    align: 'center',
    width: 100,
  },
  {
    title: '权限标识',
    dataIndex: 'perms',
    align: 'left',
    width: 200,
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    align: 'left',
    width: 200,
  },
  {
    title: '显示状态',
    dataIndex: 'visible',
    key: 'visible',
    align: 'center',
    width: 100,
  },
  {
    title: '菜单状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'center',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'menuId',
    align: 'left',
  },
];

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number): any {
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

/**初始菜单原始数据 */
let menuListData: Record<string, any>[] = [];

/**初始上级菜单选择树 */
let treeDataAll: Record<string, any>[] = [];

/**
 * 获取选择上级菜单值
 * @param value 菜单选中值
 */
function fnTreeDataChange(value: any) {
  if (!value) return;
  const menu = menuListData.find(m => m.menuId === value);
  if (!menu) return;
  // 限制可选类型
  if (menu.menuType === MENU_TYPE_DIR) {
    modalState.from.menuType = MENU_TYPE_MENU;
  }
  if (menu.menuType === MENU_TYPE_MENU) {
    modalState.from.menuType = MENU_TYPE_BUTTON;
  }
  modalState.from.parentType = menu.menuType;
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
    parentId: '0',
    menuName: '',
    menuSort: 0,
    menuType: MENU_TYPE_BUTTON,
    component: '',
    path: '',
    icon: '#',
    perms: '',
    isFrame: '1',
    isCache: '0',
    visible: '0',
    status: '0',
    createTime: 0,
    remark: '',
    parentType: '', // 标记禁止菜单类型添加目录和菜单
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
      { required: true, min: 1, max: 50, message: '请正确输入菜单名称' },
    ],
    component: [
      { required: true, min: 1, max: 200, message: '请正确输入组件路径' },
    ],
    path: [{ required: true, min: 1, max: 200, message: '请正确输入路由地址' }],
    perms: [
      { required: true, min: 1, max: 100, message: '请正确输入权限标识' },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param menuId 菜单编号id
 */
function fnModalVisibleByVive(menuId: string | number) {
  if (!menuId) {
    message.error(`菜单记录存在错误`, 2);
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  modalState.treeData = treeDataAll;
  getMenu(menuId).then(res => {
    modalState.confirmLoading = false;
    hide();
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      modalState.from = Object.assign(modalState.from, res.data);
      modalState.title = '菜单信息';
      modalState.visibleByView = true;
    } else {
      message.error(`获取菜单信息失败`, 2);
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
  parentId?: string | number,
  parentType?: string | number
) {
  modalState.treeData = treeDataAll;
  if (!menuId) {
    modalStateFrom.resetFields();
    if (parentId) {
      modalState.from.parentId = parentId;
      modalState.from.parentType = parentType;
    }
    modalState.title = '添加菜单信息';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getMenu(menuId).then(res => {
      modalState.confirmLoading = false;
      hide();
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        modalState.from = Object.assign(modalState.from, res.data);
        modalState.title = '修改菜单信息';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取菜单信息失败`, 2);
      }
    });
  }
}

/**
 * 对话框弹出确认执行函数
 * 进行表达规则校验
 */
function fnModalOk() {
  let validateNames = ['parentId', 'menuName'];
  if (modalState.from.menuType === MENU_TYPE_DIR) {
    validateNames.push('path');
  }
  if (modalState.from.menuType === MENU_TYPE_MENU) {
    validateNames.push('component');
    validateNames.push('path');
    validateNames.push('perms');
  }
  if (modalState.from.menuType === MENU_TYPE_BUTTON) {
    validateNames.push('perms');
  }
  modalStateFrom
    .validate(validateNames)
    .then(() => {
      modalState.confirmLoading = true;
      const from = toRaw(modalState.from);
      const menu = from.menuId ? updateMenu(from) : addMenu(from);
      const key = 'menu';
      message.loading({ content: '请稍等...', key });
      menu
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${modalState.title}成功`,
              key,
              duration: 2,
            });
            treeDataAll = [];
            fnGetList();
            fnModalCancel();
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
 * 菜单删除
 * @param menuId 菜单编号id
 */
function fnRecordDelete(menuId: string | number) {
  Modal.confirm({
    title: '提示',
    content: `确认删除菜单编号为 【${menuId}】 的数据项?`,
    onOk() {
      const key = 'delMenu';
      message.loading({ content: '请稍等...', key });
      delMenu(menuId).then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
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

/**查询菜单列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  listMenu(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
      menuListData = JSON.parse(JSON.stringify(res.data));
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
            children: parseDataToTreeExclude(
              data,
              'menuType',
              MENU_TYPE_BUTTON,
              'menuId'
            ),
          },
        ];
        // 展开编号key
        expandedRowKeys = [...new Set(data.map(item => item.parentId))];
        fnTableExpandedRowsAll(tableState.expandedRowAll);
      }
      // 解析生成菜单树结构
      tableState.data = parseDataToTree(res.data, 'menuId');
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
        动态路由菜单，根节点下不要创建菜单哦
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
                <a-button type="primary" @click.prevent="fnGetList()">
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
            v-perms:has="['system:menu:add']"
          >
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
        row-key="menuId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="false"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        children-column-name="children"
        :expanded-row-keys="tableState.expandedRowKeys"
        @expandedRowsChange="fnTableExpandedRowsChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <IconFont :type="record.icon" style="font-size: 18px"></IconFont>
          </template>
          <template v-if="column.key === 'visible'">
            <a-tag :color="+record.visible ? 'processing' : 'warning'">
              {{ ['隐藏', '显示'][+record.visible] }}
            </a-tag>
          </template>
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
                  v-perms:has="['system:menu:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.menuId)"
                  v-perms:has="['system:menu:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.menuId)"
                  v-perms:has="['system:menu:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip v-if="record.menuType !== MENU_TYPE_BUTTON">
                <template #title>新增子菜单</template>
                <a-button
                  type="link"
                  @click.prevent="
                    fnModalVisibleByEdit(
                      undefined,
                      record.menuId,
                      record.menuType
                    )
                  "
                  v-perms:has="['system:menu:add']"
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
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单编号" name="menuId">
              {{ modalState.from.menuId }}
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
        <a-form-item
          label="上级菜单"
          name="parentId"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            :value="modalState.from.parentId"
            placeholder="上级菜单"
            disabled
            :tree-data="modalState.treeData"
            :field-names="{
              children: 'children',
              label: 'menuName',
              value: 'menuId',
            }"
            tree-node-label-prop="menuName"
          >
            <template #suffixIcon></template>
          </a-tree-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单名称" name="menuName">
              {{ modalState.from.menuName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单排序" name="menuSort">
              {{ modalState.from.menuSort }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="菜单类型"
          name="menuType"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tag
            v-if="modalState.from.menuType === MENU_TYPE_DIR"
            color="purple"
          >
            目录
          </a-tag>
          <a-tag
            v-if="modalState.from.menuType === MENU_TYPE_MENU"
            color="cyan"
          >
            菜单
          </a-tag>
          <a-tag
            v-if="modalState.from.menuType === MENU_TYPE_BUTTON"
            color="orange"
          >
            按钮
          </a-tag>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单图标" name="icon">
              <IconFont
                :type="modalState.from.icon || '#'"
                style="font-size: 18px"
              ></IconFont>
            </a-form-item>
          </a-col>
          <a-col
            :lg="12"
            :md="12"
            :xs="24"
            v-if="modalState.from.menuType !== MENU_TYPE_BUTTON"
          >
            <a-form-item label="路由地址" name="path">
              {{ modalState.from.path }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row
          :gutter="16"
          v-if="modalState.from.menuType !== MENU_TYPE_BUTTON"
        >
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="内部地址" name="isFrame">
              <a-tag color="default">
                {{ ['否', '是'][+modalState.from.isFrame] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="页面缓存" name="isCache">
              <a-tag color="default">
                {{ ['不缓存', '缓存'][+modalState.from.isCache] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示状态" name="visible">
              <a-tag color="default">
                {{ ['隐藏', '显示'][+modalState.from.visible] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单状态" name="status">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.from.status"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="组件路径"
          name="component"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.from.menuType === MENU_TYPE_MENU"
        >
          {{ modalState.from.component }}
        </a-form-item>

        <a-form-item
          label="权限标识"
          name="perms"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.from.menuType !== MENU_TYPE_DIR"
        >
          {{ modalState.from.perms }}
        </a-form-item>

        <a-form-item
          label="菜单说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="modalState.from.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
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
      <a-form
        name="modalStateFrom"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-form-item
          label="上级菜单"
          name="parentId"
          v-bind="modalStateFrom.validateInfos.parentId"
          :label-col="{ span: 3 }"
          :label-wrap="true"
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
            @change="fnTreeDataChange"
          >
          </a-tree-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="菜单名称"
              name="menuName"
              v-bind="modalStateFrom.validateInfos.menuName"
            >
              <a-input
                v-model:value="modalState.from.menuName"
                allow-clear
                placeholder="请输入菜单名称"
                :maxlength="50"
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
                placeholder="排序值"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="菜单类型"
          name="menuType"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-radio-group v-model:value="modalState.from.menuType">
            <a-radio
              :key="MENU_TYPE_DIR"
              :value="MENU_TYPE_DIR"
              :disabled="modalState.from.parentType === MENU_TYPE_MENU"
            >
              目录
            </a-radio>
            <a-radio
              :key="MENU_TYPE_MENU"
              :value="MENU_TYPE_MENU"
              :disabled="modalState.from.parentType === MENU_TYPE_MENU"
            >
              菜单
            </a-radio>
            <a-radio :key="MENU_TYPE_BUTTON" :value="MENU_TYPE_BUTTON">
              按钮
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <a-row
          :gutter="16"
          v-if="modalState.from.menuType !== MENU_TYPE_BUTTON"
        >
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单图标" name="icon">
              <a-select
                v-model:value="modalState.from.icon"
                placeholder="请选择菜单图标"
                show-search
                option-filter-prop="label"
                option-label-prop="label"
                :options="icons"
              >
                <template #suffixIcon>
                  <IconFont :type="modalState.from.icon"></IconFont>
                </template>
                <template #option="{ value, label }">
                  <div style="font-size: 18px">
                    <IconFont :type="value"></IconFont>
                    &nbsp;&nbsp;{{ label }}
                  </div>
                </template>
              </a-select>
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
                :maxlength="200"
              >
                <template #prefix>
                  <a-tooltip placement="topLeft">
                    <template #title>
                      <div>
                        访问的路由地址，如：user、/auth
                        <br />
                        1. 如网络地址需内部访问<br />则以 http(s):// 开头
                        <br />菜单行为（根节点）：当前窗口打开
                        <br />菜单行为（非根节点）：内嵌窗口
                        <br />
                        2. 如网络地址需外部访问<br />则将内部地址选项设为否
                        <br />菜单行为：打开新标签
                        <br />
                        3. 如内嵌子页面需要隐藏页面<br />则将显示状态选项设为隐藏
                        <br />地址拼接以内嵌路由地址
                        {{ MENU_PATH_INLINE }}/子页面地址
                      </div>
                    </template>
                    <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
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
          <a-col :lg="12" :md="12" :xs="24">
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
          <a-col :lg="12" :md="12" :xs="24">
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
          <a-col :lg="12" :md="12" :xs="24">
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
          label="组件路径"
          name="component"
          v-bind="modalStateFrom.validateInfos.component"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.from.menuType === MENU_TYPE_MENU"
        >
          <a-input
            v-model:value="modalState.from.component"
            allow-clear
            placeholder="请输入组件路径"
            :maxlength="200"
          >
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    页面组件目录 views <br />
                    访问的组件路径,如：system/user/index <br />
                    注意：不带 .vue 文件后缀 <br />
                    路由地址是网络地址可填入链接
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="权限标识"
          name="perms"
          v-bind="modalStateFrom.validateInfos.perms"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.from.menuType !== MENU_TYPE_DIR"
        >
          <a-input
            v-model:value="modalState.from.perms"
            allow-clear
            placeholder="请输入权限标识"
            :maxlength="100"
          >
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    权限标识示例：monitor:server:query <br />
                    后端控制器中使用权限标识，如： <br />
                    @PreAuthorize({ hasPermissions: ['monitor:server:query'] })
                    <br />
                    前端vue页面中使用权限标识，如： <br />
                    v-perms:has="['monitor:server:query']"
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="菜单说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.from.remark"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="450"
            :show-count="true"
            placeholder="请输入菜单说明"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </PageContainer>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}
</style>
