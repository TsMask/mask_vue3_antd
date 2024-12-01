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
  exportRole,
  addRole,
  changeRoleStatus,
  dataScope,
  delRole,
  getRole,
  listRole,
  updateRole,
} from '@/api/system/role';
import { menuTreeSelect, menuTreeSelectRole } from '@/api/system/menu';
import { deptTreeRole } from '@/api/system/dept';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
import { DataNode } from 'ant-design-vue/lib/tree';
import { parseTreeKeys, parseTreeNodeKeys } from '@/utils/parse-tree-utils';
import { hasPermissions } from '@/plugins/auth-user';
import { MENU_PATH_INLINE } from '@/constants/menu-constants';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system-constants';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { getDict } = useDictStore();
const route = useRoute();
const router = useRouter();
const routePath = route.path;

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**状态 */
  sysNormalDisable: DictType[];
} = reactive({
  sysNormalDisable: [],
});

/**开始结束时间 */
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/**查询参数 */
let queryParams = reactive({
  /**角色名称 */
  roleName: '',
  /**角色键值 */
  roleKey: '',
  /**角色状态 */
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
    roleName: '',
    roleKey: '',
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
    title: '角色编号',
    dataIndex: 'roleId',
    align: 'left',
    width: 100,
  },
  {
    title: '角色名称',
    dataIndex: 'roleName',
    align: 'left',
    width: 100,
  },
  {
    title: '角色键值',
    dataIndex: 'roleKey',
    align: 'left',
    width: 100,
  },
  {
    title: '角色顺序',
    dataIndex: 'roleSort',
    align: 'left',
    width: 100,
  },
  {
    title: '角色状态',
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
    key: 'roleId',
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

/**数据范围选项 */
const dataScopeOptions = ref<{ value: string; label: string }[]>([
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' },
]);

type TreeDataType = {
  /**树结构数据 */
  treeData: DataNode[];
  /**选中复选框的树节点 */
  checkedKeys: string[] | number[];
  /**展开指定的树节点 */
  expandedKeys: string[] | number[];
};

/**初始菜单树数据 */
let menuTree: TreeDataType = {
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};

/**初始部门树数据 */
let deptTree: TreeDataType = {
  treeData: [],
  checkedKeys: [],
  expandedKeys: [],
};

/**对话框对象信息状态类型 */
type ModalStateType = {
  /**详情框是否显示 */
  visibleByView: boolean;
  /**新增框或修改框是否显示 */
  visibleByEdit: boolean;
  /**分配角色数据权限修改框是否显示 */
  visibleByDataScope: boolean;
  /**标题 */
  title: string;
  /**表单数据 */
  form: Record<string, any>;
  /**确定按钮 loading */
  confirmLoading: boolean;
  /**菜单树结构 */
  menuTree: TreeDataType;
  /**部门树结构 */
  deptTree: TreeDataType;
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  visibleByDataScope: false,
  title: '角色',
  form: {
    roleId: undefined,
    roleName: '',
    roleKey: '',
    roleSort: 0,
    statusFlag: '0',
    menuIds: [],
    deptIds: [],
    remark: '',
    dataScope: '5',
    deptCheckStrictly: '1',
    menuCheckStrictly: '1',
    createTime: 0,
  },
  confirmLoading: false,
  menuTree: {
    treeData: [],
    checkedKeys: [],
    expandedKeys: [],
  },
  deptTree: {
    treeData: [],
    checkedKeys: [],
    expandedKeys: [],
  },
});

/**对话框内表单属性和校验规则 */
const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    roleName: [
      { required: true, min: 1, max: 30, message: '请正确输入角色名称' },
    ],
    roleKey: [
      { required: true, min: 1, max: 50, message: '请正确输入角色键值' },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param roleId 角色编号ID
 */
function fnModalVisibleByVive(roleId: string | number) {
  if (!roleId) {
    message.error(`角色记录存在错误`, 2);
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  // 查询角色详细同时根据角色ID查询菜单下拉树结构
  Promise.all([getRole(roleId), menuTreeSelectRole(roleId)]).then(resArr => {
    modalState.confirmLoading = false;
    hide();
    if (resArr[0].code === RESULT_CODE_SUCCESS && resArr[0].data) {
      Object.assign(modalState.form, resArr[0].data);
      if (resArr[1].code === RESULT_CODE_SUCCESS && resArr[1].data) {
        const { menus, checkedKeys } = resArr[1].data;
        menuTree.checkedKeys = parseTreeKeys(menus, 'id');
        menuTree.expandedKeys = parseTreeNodeKeys(menus, 'id');
        menuTree.treeData = menus;
        modalState.menuTree.treeData = menus;
        modalState.menuTree.checkedKeys = checkedKeys;
        modalState.form.menuIds = checkedKeys;
      }
      modalState.title = '角色信息';
      modalState.visibleByView = true;
    } else {
      message.error(`获取角色信息失败`, 2);
    }
  });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param roleId 角色编号ID, 不传为新增
 */
function fnModalVisibleByEdit(roleId?: string | number) {
  if (!roleId) {
    modalStateForm.resetFields();
    if (menuTree.treeData.length > 0) {
      modalState.menuTree.treeData = menuTree.treeData;
      modalState.title = '添加角色信息';
      modalState.visibleByEdit = true;
    } else {
      if (modalState.confirmLoading) return;
      const hide = message.loading('正在打开...', 0);
      modalState.confirmLoading = true;
      // 查询菜单下拉树结构
      menuTreeSelect().then(res => {
        modalState.confirmLoading = false;
        hide();
        if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
          menuTree.checkedKeys = parseTreeKeys(res.data, 'id');
          menuTree.expandedKeys = parseTreeNodeKeys(res.data, 'id');
          menuTree.treeData = res.data;
          modalState.menuTree.treeData = res.data;
          modalState.title = '添加角色信息';
          modalState.visibleByEdit = true;
        }
      });
    }
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    // 查询角色详细同时根据角色ID查询菜单下拉树结构
    Promise.all([getRole(roleId), menuTreeSelectRole(roleId)]).then(resArr => {
      modalState.confirmLoading = false;
      hide();
      if (resArr[0].code === RESULT_CODE_SUCCESS && resArr[0].data) {
        Object.assign(modalState.form, resArr[0].data);
        if (resArr[1].code === RESULT_CODE_SUCCESS && resArr[1].data) {
          const { menus, checkedKeys } = resArr[1].data;
          menuTree.checkedKeys = parseTreeKeys(menus, 'id');
          menuTree.expandedKeys = parseTreeNodeKeys(menus, 'id');
          menuTree.treeData = menus;
          modalState.menuTree.treeData = menus;
          modalState.menuTree.checkedKeys = checkedKeys;
          modalState.form.menuIds = checkedKeys;
        }
        modalState.title = '修改角色信息';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取角色信息失败`, 2);
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
      modalState.confirmLoading = true;
      const form = toRaw(modalState.form);
      const role = form.roleId ? updateRole(form) : addRole(form);
      const key = 'role';
      message.loading({ content: '请稍等...', key });
      role
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${modalState.title}成功`,
              key,
              duration: 2,
            });
            fnGetList(1);
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
  modalState.visibleByDataScope = false;
  modalStateForm.resetFields();
  modalState.menuTree.checkedKeys = [];
  modalState.menuTree.expandedKeys = [];
  modalState.deptTree.checkedKeys = [];
  modalState.deptTree.expandedKeys = [];
}

/**
 * 对话框表单树勾选事件
 */
function fnModalTreeChecked(keys: any, info: any, type: 'menu' | 'dept') {
  let ids = Array.isArray(keys) ? keys : keys.checked;
  if (type === 'menu') {
    if (modalState.form.menuCheckStrictly === '1') {
      ids = ids.concat(info.halfCheckedKeys);
    }
    modalState.form.menuIds = ids;
  }
  if (type === 'dept') {
    if (modalState.form.deptCheckStrictly === '1') {
      ids = ids.concat(info.halfCheckedKeys);
    }
    modalState.form.deptIds = ids;
  }
}

/**
 * 对话框表单树（展开/折叠）事件
 */
function fnModalExpandedKeys(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') {
    modalState.menuTree.expandedKeys = checked ? menuTree.expandedKeys : [];
  }
  if (type === 'dept') {
    modalState.deptTree.expandedKeys = checked ? deptTree.expandedKeys : [];
  }
}

/**
 * 对话框表单树（全选/全不选）事件
 */
function fnModalCheckedKeys(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') {
    modalState.menuTree.checkedKeys = checked ? menuTree.checkedKeys : [];
    modalState.form.menuIds = modalState.menuTree.checkedKeys;
  }
  if (type === 'dept') {
    modalState.deptTree.checkedKeys = checked ? deptTree.checkedKeys : [];
    modalState.form.deptIds = modalState.deptTree.checkedKeys;
  }
}

/**
 * 对话框表单树（父子联动）事件
 */
function fnModalCheckStrictly(checked: boolean, type: 'menu' | 'dept') {
  if (type === 'menu') {
    modalState.form.menuCheckStrictly = checked ? '1' : '0';
  }
  if (type === 'dept') {
    modalState.form.deptCheckStrictly = checked ? '1' : '0';
  }
}

/**
 * 对话框弹出分配数据权限确认执行函数
 */
function fnModalOkDataScope() {
  if (modalState.confirmLoading) return;
  modalState.confirmLoading = true;
  const hide = message.loading('请稍等...', 0);
  const fromInfo = toRaw(modalState.form);
  if (fromInfo.dataScope !== '2') {
    fromInfo.deptIds = [];
  }
  dataScope(fromInfo)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        message.success({
          content: `${modalState.title}成功`,
          duration: 2,
        });
        modalState.visibleByDataScope = false;
        modalStateForm.resetFields();
      } else {
        message.error({
          content: `${res.msg}`,
          duration: 2,
        });
      }
    })
    .finally(() => {
      hide();
      modalState.confirmLoading = false;
    });
}

/**
 * 角色分配数据权限
 * @param roleId 角色编号ID
 */
function fnRecordDataScope(roleId: string | number) {
  if (!roleId) {
    message.error(`角色记录存在错误`, 2);
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  // 查询角色详细同时根据角色ID查询部门树结构
  Promise.all([getRole(roleId), deptTreeRole(roleId)])
    .then(resArr => {
      if (resArr[0].code === RESULT_CODE_SUCCESS && resArr[0].data) {
        Object.assign(modalState.form, resArr[0].data);
        if (resArr[1].code === RESULT_CODE_SUCCESS && resArr[1].data) {
          const { depts, checkedKeys } = resArr[1].data;
          deptTree.checkedKeys = parseTreeKeys(depts, 'id');
          deptTree.expandedKeys = parseTreeNodeKeys(depts, 'id');
          deptTree.treeData = depts;
          modalState.deptTree.treeData = depts;
          modalState.deptTree.checkedKeys = checkedKeys;
          modalState.form.deptIds = checkedKeys;
        }
        modalState.title = '分配数据权限';
        modalState.visibleByDataScope = true;
      } else {
        message.error(`获取角色信息失败`, 2);
      }
    })
    .finally(() => {
      modalState.confirmLoading = false;
      hide();
    });
}

/**
 * 角色分配用户跳转
 * @param roleId 角色编号ID
 */
function fnRecordAuthUser(row: Record<string, string>) {
  router.push({
    path: `${routePath}${MENU_PATH_INLINE}/auth-user/${row.roleId}`,
    query: {
      roleName: row.roleName,
    },
  });
}

/**
 * 角色状态修改
 * @param row 角色记录对象
 */
function fnRecordStatus(row: Record<string, string>) {
  const text = row.statusFlag === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.roleName} 角色吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      changeRoleStatus(row.roleId, row.statusFlag).then(res => {
        hide();
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success({
            content: `${row.roleName} ${text}成功`,
            duration: 2,
          });
        } else {
          message.error({
            content: `${row.roleName} ${text}失败`,
            duration: 2,
          });
        }
        fnGetList();
      });
    },
    onCancel() {
      row.statusFlag = row.statusFlag === '1' ? '0' : '1';
    },
  });
}

/**
 * 角色删除
 * @param roleId 角色编号ID
 */
function fnRecordDelete(roleId: string = '0') {
  if (roleId === '0') {
    roleId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除角色编号为 【${roleId}】 的数据项?`,
    onOk() {
      const key = 'delRole';
      message.loading({ content: '请稍等...', key });
      delRole(roleId).then(res => {
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
            key,
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
      const key = 'exportRole';
      message.loading({ content: '请稍等...', key });
      exportRole(toRaw(queryParams)).then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success({
            content: `已完成导出`,
            key,
            duration: 2,
          });
          saveAs(res.data, `role_${Date.now()}.xlsx`);
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

/**查询角色列表, pageNum初始页数 */
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

  listRole(toRaw(queryParams)).then(res => {
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
        给予用户角色标记，可分配给用户多个角色，分配数据权限需要关联部门数据表进行相关配置生效。
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
            <a-form-item label="角色名称" name="roleName">
              <a-input
                v-model:value="queryParams.roleName"
                allow-clear
                placeholder="请输入角色名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey">
              <a-input
                v-model:value="queryParams.roleKey"
                allow-clear
                placeholder="请输入角色键值"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
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
            v-perms:has="['system:role:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['system:role:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['system:role:export']"
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
        row-key="roleId"
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
            <a-switch
              v-if="
                dict.sysNormalDisable.length > 0 &&
                record.roleId !== SYS_ROLE_SYSTEM_ID &&
                hasPermissions(['system:role:edit'])
              "
              v-model:checked="record.statusFlag"
              checked-value="1"
              :checked-children="dict.sysNormalDisable[0].label"
              un-checked-value="0"
              :un-checked-children="dict.sysNormalDisable[1].label"
              size="small"
              @change="fnRecordStatus(record)"
            />
            <DictTag
              v-else
              :options="dict.sysNormalDisable"
              :value="record.statusFlag"
            />
          </template>
          <template v-if="column.key === 'roleId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.roleId)"
                  v-perms:has="['system:role:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.roleId !== SYS_ROLE_SYSTEM_ID">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.roleId)"
                  v-perms:has="['system:role:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.roleId !== SYS_ROLE_SYSTEM_ID">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.roleId)"
                  v-perms:has="['system:role:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.roleId !== SYS_ROLE_SYSTEM_ID">
                <template #title>分配数据权限</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDataScope(record.roleId)"
                  v-perms:has="['system:role:edit']"
                >
                  <template #icon><SecurityScanOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.roleId !== SYS_ROLE_SYSTEM_ID">
                <template #title>分配用户</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordAuthUser(record)"
                  v-perms:has="['system:role:auth']"
                >
                  <template #icon><TeamOutlined /></template>
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
            <a-form-item label="角色编号" name="roleId">
              {{ modalState.form.roleId }}
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
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色顺序" name="roleSort">
              {{ modalState.form.roleSort }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              {{ modalState.form.roleName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey">
              {{ modalState.form.roleKey }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="角色说明"
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

        <a-form-item
          label="菜单权限"
          name="menuCheckStrictly"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree
            disabled
            checkable
            :selectable="false"
            v-model:expanded-keys="modalState.menuTree.expandedKeys"
            v-model:checked-keys="modalState.menuTree.checkedKeys"
            :check-strictly="modalState.form.menuCheckStrictly === '0'"
            :tree-data="modalState.menuTree.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }"
            :height="256"
            style="border: 1px solid #d9d9d9; margin-top: 4px"
          >
          </a-tree>
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
        name="modalStateFormByEdit"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="角色名称"
              name="roleName"
              v-bind="modalStateForm.validateInfos.roleName"
            >
              <a-input
                v-model:value="modalState.form.roleName"
                allow-clear
                placeholder="请输入角色名称"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="角色状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="角色键值"
              name="roleKey"
              v-bind="modalStateForm.validateInfos.roleKey"
            >
              <a-input
                v-model:value="modalState.form.roleKey"
                allow-clear
                placeholder="请输入角色键值"
                :maxlength="50"
              >
                <template #prefix>
                  <a-tooltip placement="topLeft">
                    <template #title>
                      <div>
                        权限标识示例：dba <br />
                        控制器中使用权限标识，如： <br />
                        @PreAuthorize({ hasRoles: ['dba'] })
                      </div>
                    </template>
                    <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色顺序" name="roleSort">
              <a-input-number
                v-model:value="modalState.form.roleSort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="排序值"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="角色说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="450"
            :show-count="true"
            placeholder="请输入角色说明"
          />
        </a-form-item>

        <a-form-item
          label="菜单权限"
          name="menuCheckStrictly"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-space :size="12" align="center">
            <a-checkbox
              id="menu_1"
              :checked="modalState.menuTree.expandedKeys.length > 0"
              @change="(e:any) => fnModalExpandedKeys(e.target.checked, 'menu')"
            >
              展开/折叠
            </a-checkbox>
            <a-checkbox
              id="menu_2"
              :checked="modalState.form.menuIds.length > 0"
              @change="(e:any) => fnModalCheckedKeys(e.target.checked, 'menu')"
            >
              全选/全不选
            </a-checkbox>
            <a-checkbox
              id="menu_3"
              :checked="modalState.form.menuCheckStrictly === '1'"
              @change="(e:any) => fnModalCheckStrictly(e.target.checked, 'menu')"
            >
              父子联动
            </a-checkbox>
          </a-space>
          <a-tree
            checkable
            :selectable="false"
            @check="
              (checked:any, info:any) => fnModalTreeChecked(checked, info, 'menu')
            "
            v-model:expanded-keys="modalState.menuTree.expandedKeys"
            v-model:checked-keys="modalState.menuTree.checkedKeys"
            :check-strictly="modalState.form.menuCheckStrictly === '0'"
            :tree-data="modalState.menuTree.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }"
            :height="256"
            style="border: 1px solid #d9d9d9; margin-top: 4px"
          >
          </a-tree>
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 分配角色数据权限修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="false"
      :mask-closable="false"
      :visible="modalState.visibleByDataScope"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="fnModalOkDataScope"
      @cancel="fnModalCancel"
    >
      <a-form name="modalStateFormByDataScope" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色编号" name="roleId">
              {{ modalState.form.roleId }}
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
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色顺序" name="roleSort">
              {{ modalState.form.roleSort }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色名称" name="roleName">
              {{ modalState.form.roleName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="角色键值" name="roleKey">
              {{ modalState.form.roleKey }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="角色说明" name="remark">
          <a-textarea
            :value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>

        <a-form-item label="权限范围" name="dataScope">
          <a-select
            v-model:value="modalState.form.dataScope"
            default-value="5"
            placeholder="权限范围"
            :options="dataScopeOptions"
          >
          </a-select>
        </a-form-item>
        <a-form-item
          label="数据权限"
          name="deptCheckStrictly"
          v-show="modalState.form.dataScope === '2'"
        >
          <a-space :size="12" align="center">
            <a-checkbox
              id="dept_1"
              :checked="modalState.deptTree.expandedKeys.length > 0"
              @change="(e:any) => fnModalExpandedKeys(e.target.checked, 'dept')"
            >
              展开/折叠
            </a-checkbox>
            <a-checkbox
              id="dept_2"
              :checked="modalState.form.deptIds.length > 0"
              @change="(e:any) => fnModalCheckedKeys(e.target.checked, 'dept')"
            >
              全选/全不选
            </a-checkbox>
            <a-checkbox
              id="dept_1"
              :checked="modalState.form.deptCheckStrictly === '1'"
              @change="(e:any) => fnModalCheckStrictly(e.target.checked, 'dept')"
            >
              父子联动
            </a-checkbox>
          </a-space>
          <a-tree
            checkable
            :selectable="false"
            @check="
              (checked:any, info:any) => fnModalTreeChecked(checked, info, 'dept')
            "
            v-model:expanded-keys="modalState.deptTree.expandedKeys"
            v-model:checked-keys="modalState.deptTree.checkedKeys"
            :check-strictly="modalState.form.deptCheckStrictly === '0'"
            :tree-data="modalState.deptTree.treeData"
            :field-names="{ children: 'children', title: 'label', key: 'id' }"
            :height="256"
            style="border: 1px solid #d9d9d9; margin-top: 4px"
          >
          </a-tree>
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
