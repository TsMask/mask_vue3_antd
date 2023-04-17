<script setup lang="ts">
import {
  UserOutlined,
  LockOutlined,
  ExportOutlined,
  PlusOutlined,
  FormOutlined,
  ProfileOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { message, Modal, Form } from 'ant-design-vue';
import { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import { SizeType } from 'ant-design-vue/es/config-provider';
import { ColumnsType } from 'ant-design-vue/es/table';
import {
  exportUser,
  changeUserStatus,
  listUser,
  resetUserPwd,
  delUser,
  getUser,
  updateUser,
  addUser,
} from '@/api/system/user';
import { deptTreeSelect } from '@/api/system/dept';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/DateUtils';
import {
  regExpPasswd,
  regExpMobile,
  regExpNick,
  regExpEmail,
  regExpUserName,
} from '@/utils/RegularUtils';
import useDictStore from '@/store/modules/dict';
import useUserStore from '@/store/modules/user';
import { DataNode } from 'ant-design-vue/es/tree';
import { hasPermissions } from '@/plugins/AuthUser';
const { getDict } = useDictStore();
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**状态 */
  sysNormalDisable: DictType[];
  /**性别 */
  sysUserSex: DictType[];
} = reactive({
  sysNormalDisable: [],
  sysUserSex: [],
});

/**开始结束时间 */
let queryRangePicker = ref<[string, string]>(['', '']);

/**查询参数 */
let queryParams = reactive({
  /**登录账号 */
  userName: '',
  /**手机号 */
  phonenumber: '',
  /**部门ID */
  deptId: '',
  /**用户状态 */
  status: undefined,
  /**记录开始时间 */
  beginTime: '',
  /**记录结束时间 */
  endTime: '',
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  queryParams = Object.assign(queryParams, {
    userName: '',
    phonenumber: '',
    deptId: '',
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
    title: '用户编号',
    dataIndex: 'userId',
    align: 'center',
  },
  {
    title: '登录账号',
    dataIndex: 'userName',
    align: 'center',
  },
  {
    title: '用户昵称',
    dataIndex: 'nickName',
    align: 'center',
  },
  {
    title: '手机号码',
    dataIndex: 'phonenumber',
    align: 'center',
  },
  {
    title: '部门名称',
    dataIndex: 'deptId',
    key: 'deptId',
    align: 'center',
  },
  {
    title: '登录地址',
    dataIndex: 'loginIp',
    key: 'loginIp',
    align: 'center',
  },
  {
    title: '登录时间',
    dataIndex: 'loginDate',
    align: 'center',
    customRender(opt) {
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '用户状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  {
    title: '操作',
    key: 'userId',
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

type OptionsType = {
  /**岗位选择列表 */
  posts: Record<string, any>[];
  /**角色选择列表 */
  roles: Record<string, any>[];
};

/**初始用户选择列表 */
let options: OptionsType = {
  posts: [],
  roles: [],
};

/**对话框对象信息状态类型 */
type ModalStateType = {
  /**详情框是否显示 */
  visibleByView: boolean;
  /**新增框或修改框是否显示 */
  visibleByEdit: boolean;
  /**重置密码框是否显示 */
  visibleByResetPwd: boolean;
  /**标题 */
  title: string;
  /**表单数据 */
  from: Record<string, any>;
  /**确定按钮 loading */
  confirmLoading: boolean;
  /**选择列表 */
  options: OptionsType;
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  visibleByResetPwd: false,
  title: '用户',
  from: {
    userId: undefined,
    userName: '',
    password: '',
    deptId: '100',
    email: '',
    loginDate: '',
    loginIp: '',
    nickName: '',
    phonenumber: '',
    postIds: [],
    roleIds: [],
    sex: '1',
    status: '0',
    remark: '',
    createTime: '0',
  },
  confirmLoading: false,
  options: {
    posts: [],
    roles: [],
  },
});

/**对话框内表单属性和校验规则 */
const modalStateFrom = Form.useForm(
  modalState.from,
  reactive({
    userName: [
      {
        required: true,
        pattern: regExpUserName,
        message: '账号不能以数字开头，可包含大写小写字母，数字，且不少于5位',
      },
    ],
    password: [
      {
        required: true,
        pattern: regExpPasswd,
        message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
      },
    ],
    nickName: [
      {
        required: true,
        pattern: regExpNick,
        message: '昵称只能包含字母、数字、中文和下划线，且不少于2位',
      },
    ],
    email: [
      {
        required: false,
        pattern: regExpEmail,
        message: '请输入正确的邮箱地址',
      },
    ],
    phonenumber: [
      {
        required: false,
        pattern: regExpMobile,
        message: '请输入正确的手机号码',
      },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param userId 用户编号ID
 */
function fnModalVisibleByVive(userId: string | number) {
  if (!userId) {
    message.error(`用户记录存在错误`, 2);
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  getUser(userId).then(res => {
    modalState.confirmLoading = false;
    hide();
    if (res.code === 200) {
      modalState.options.roles = res.roles;
      modalState.options.posts = res.posts;
      modalState.from = Object.assign(modalState.from, res.data);
      modalState.from.roleIds = res.roleIds;
      modalState.from.postIds = res.postIds;
      // 头像解析
      modalState.from.avatar = useUserStore().fnAvatar(modalState.from.avatar);
      modalState.title = '用户信息';
      modalState.visibleByView = true;
    } else {
      message.error('获取用户信息失败', 2);
    }
  });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param userId 用户编号ID, 不传为新增
 */
function fnModalVisibleByEdit(userId?: string | number) {
  if (!userId) {
    modalStateFrom.resetFields();
    if (options.roles.length > 0) {
      modalState.options.roles = options.roles;
      modalState.options.posts = options.posts;
      modalState.title = '添加用户信息';
      modalState.visibleByEdit = true;
    } else {
      if (modalState.confirmLoading) return;
      const hide = message.loading('正在打开...', 0);
      modalState.confirmLoading = true;
      // 查询用户详细获取岗位和角色列表
      getUser().then(res => {
        modalState.confirmLoading = false;
        hide();
        if (res.code === 200) {
          options.roles = res.roles;
          options.posts = res.posts;
          modalState.options.roles = res.roles;
          modalState.options.posts = res.posts;
          modalState.from = Object.assign(modalState.from, res.data);
          modalState.from.roleIds = res.roleIds;
          modalState.from.postIds = res.postIds;
          modalState.title = '添加用户信息';
          modalState.visibleByEdit = true;
        } else {
          message.error('获取用户信息失败', 2);
        }
      });
    }
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getUser(userId).then(res => {
      modalState.confirmLoading = false;
      hide();
      if (res.code === 200) {
        modalState.options.roles = res.roles;
        modalState.options.posts = res.posts;
        modalState.from = Object.assign(modalState.from, res.data);
        modalState.from.roleIds = res.roleIds;
        modalState.from.postIds = res.postIds;
        modalState.title = '修改用户信息';
        modalState.visibleByEdit = true;
      } else {
        message.error(`获取用户信息失败`, 2);
      }
    });
  }
}

/**
 * 对话框弹出确认执行函数
 * 进行表达规则校验
 */
function fnModalOk() {
  let validateName = ['nickName', 'email', 'phonenumber'];
  if (!modalState.from.userId) {
    validateName.push('userName', 'password');
  }
  modalStateFrom
    .validate(validateName)
    .then(() => {
      modalState.confirmLoading = true;
      const from = toRaw(modalState.from);
      const user = from.userId ? updateUser(from) : addUser(from);
      const key = 'user';
      message.loading({ content: '请稍等...', key });
      user
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
  modalState.visibleByResetPwd = false;
  modalStateFrom.resetFields();
  modalState.options.roles = [];
  modalState.options.posts = [];
}

/**
 * 对话框弹出重置密码确认执行函数
 * 进行表达规则校验
 */
function fnModalOkResetPwd() {
  modalStateFrom
    .validate(['userName', 'password'])
    .then(() => {
      modalState.confirmLoading = true;
      const key = 'user';
      message.loading({ content: '请稍等...', key });
      resetUserPwd(modalState.from.userId, modalState.from.password)
        .then(res => {
          if (res.code === 200) {
            message.success({
              content: `${modalState.title}成功`,
              key,
              duration: 2,
            });
            modalState.visibleByResetPwd = false;
            modalStateFrom.resetFields();
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
 * 对话框弹出显示为 用户重置密码
 * @param row 用户记录对象
 */
function fnRecordResetPwd(row: Record<string, string>) {
  modalStateFrom.resetFields();
  modalState.from.userId = row.userId;
  modalState.from.userName = row.userName;
  modalState.title = '重置密码';
  modalState.visibleByResetPwd = true;
}

/**
 * 用户状态修改
 * @param row 用户记录对象
 */
function fnRecordStatus(row: Record<string, string>) {
  const text = row.status === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.userName} 用户吗?`,
    onOk() {
      const key = 'changeUserStatus';
      message.loading({ content: '请稍等...', key });
      changeUserStatus(row.userId, row.status).then(res => {
        if (res.code === 200) {
          message.success({
            content: `${row.userName} ${text}成功`,
            key: key,
            duration: 2,
          });
        } else {
          message.error({
            content: `${res.msg}`,
            key: key,
            duration: 2,
          });
        }
        fnGetList();
      });
    },
    onCancel() {
      row.status = row.status === '1' ? '0' : '1';
    },
  });
}

/**
 * 用户删除
 * @param userId 用户编号ID
 */
function fnRecordDelete(userId: string = '0') {
  if (userId === '0') {
    userId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除用户编号为 【${userId}】 的数据项?`,
    onOk() {
      const key = 'delUser';
      message.loading({ content: '请稍等...', key });
      delUser(userId).then(res => {
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
      const key = 'exportUser';
      message.loading({ content: '请稍等...', key });
      exportUser(toRaw(queryParams)).then(resBlob => {
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
          saveAs(resBlob, `user_${Date.now()}.xlsx`);
        }
      });
    },
  });
}

/**查询用户列表 */
function fnGetList() {
  if (tableState.loading) return;
  tableState.loading = true;
  queryParams.beginTime = queryRangePicker.value[0];
  queryParams.endTime = queryRangePicker.value[1];
  listUser(toRaw(queryParams)).then(res => {
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

/**初始部门树数据 */
let deptTreeData = ref<DataNode[]>([]);

/**查询部门下拉树结构 */
function fnGetDeptTree() {
  if (deptTreeData.value.length > 0) return;
  deptTreeSelect().then(res => {
    if (res.code === 200 && Array.isArray(res.data)) {
      deptTreeData.value = res.data;
    }
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([
    getDict('sys_normal_disable'),
    getDict('sys_user_sex'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNormalDisable = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.sysUserSex = resArr[1].value;
    }
  });
  // 获取列表数据
  fnGetList();
  // 获取部门树结构数据
  fnGetDeptTree();
});
</script>

<template>
  <page-container :title="title">
    <template #content>
      <a-typography-paragraph> 所有系统用户管理列表 </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="18" :md="12" :xs="24">
            <a-form-item label="部门名称" name="deptId">
              <a-tree-select
                v-model:value="queryParams.deptId"
                placeholder="部门名称"
                show-search
                tree-default-expand-all
                :tree-data="deptTreeData"
                :field-names="{
                  children: 'children',
                  label: 'label',
                  value: 'id',
                }"
                tree-node-label-prop="label"
                tree-node-filter-prop="label"
                style="width: 100%"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
              >
              </a-tree-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fnGetList">
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
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                placeholder="请输入登录账号"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phonenumber">
              <a-input
                v-model:value="queryParams.phonenumber"
                allow-clear
                placeholder="请输入手机号码"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="用户状态" name="status">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="8" :md="12" :xs="24">
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
            v-perms:has="['system:user:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['system:user:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['system:user:import']"
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
        row-key="userId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="tablePagination"
        :scroll="{ x: true }"
        :row-selection="{
          type: 'checkbox',
          onChange: selectedRowKeys => fnTableSelectedRowKeys(selectedRowKeys),
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deptId'">
            {{ record.dept?.deptName }}
          </template>
          <template v-if="column.key === 'status'">
            <a-switch
              v-if="
                record.userId !== '1' && hasPermissions(['system:user:edit'])
              "
              v-model:checked="record.status"
              checked-value="1"
              checked-children="正常"
              un-checked-value="0"
              un-checked-children="暂停"
              size="small"
              @change="fnRecordStatus(record)"
            />
            <DictTag
              v-else
              :options="dict.sysNormalDisable"
              :value="record.status"
            />
          </template>
          <template v-if="column.key === 'userId'">
            <a-space :size="8" align="center" v-if="record.userId !== '1'">
              <a-tooltip>
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.userId)"
                  v-perms:has="['system:user:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.userId)"
                  v-perms:has="['system:user:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.userId)"
                  v-perms:has="['system:user:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>重置密码</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordResetPwd(record)"
                  v-perms:has="['system:user:resetPwd']"
                >
                  <template #icon><SecurityScanOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <a-modal
      v-perms:has="['system:user:query']"
      width="800px"
      :visible="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户编号" name="userId">
              {{ modalState.from.userId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              {{ parseDateToStr(+modalState.from.createTime) }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录地址" name="loginIp">
              {{ modalState.from.loginIp }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录时间" name="loginDate">
              {{ parseDateToStr(+modalState.from.loginDate) }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户头像" name="avatar">
              <a-avatar
                shape="circle"
                size="default"
                :src="modalState.from.avatar"
                :alt="modalState.from.userName"
              ></a-avatar>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              {{ modalState.from.userName }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户昵称" name="nickName">
              {{ modalState.from.nickName }}
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="用户性别" name="sex">
              <DictTag
                :options="dict.sysUserSex"
                :value="modalState.from.sex"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="用户状态" name="status">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.from.status"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phonenumber">
              {{ modalState.from.phonenumber }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="电子邮箱" name="email">
              {{ modalState.from.email }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="归属部门" name="deptId">
          <a-tree-select
            :value="modalState.from.deptId"
            placeholder="归属部门"
            disabled
            :tree-data="deptTreeData"
            :field-names="{
              children: 'children',
              label: 'label',
              value: 'id',
            }"
            tree-node-label-prop="label"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          >
            <template #suffixIcon></template>
          </a-tree-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户岗位" name="postIds">
              <a-select
                :value="modalState.from.postIds"
                disabled
                mode="multiple"
                placeholder="请选择用户岗位"
                option-label-prop="postName"
                :options="modalState.options.posts"
                :field-names="{ label: 'postName', value: 'postId' }"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户角色" name="roleIds">
              <a-select
                :value="modalState.from.roleIds"
                disabled
                mode="multiple"
                placeholder="请选择用户角色"
                option-label-prop="roleName"
                :options="modalState.options.roles"
                :field-names="{ label: 'roleName', value: 'roleId' }"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="用户说明" name="remark">
          {{ modalState.from.remark }}
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="fnModalCancel">关闭</a-button>
      </template>
    </a-modal>

    <!-- 新增框或修改框 -->
    <a-modal
      v-perms:has="['system:user:add', 'system:user:edit']"
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
        <a-row :gutter="16" v-if="!modalState.from.userId">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="登录账号"
              name="userName"
              v-bind="modalStateFrom.validateInfos.userName"
            >
              <a-input
                v-model:value="modalState.from.userName"
                allow-clear
                placeholder="请输入登录账号"
              >
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="登录密码"
              name="password"
              v-bind="modalStateFrom.validateInfos.password"
            >
              <a-input-password
                v-model:value="modalState.from.password"
                placeholder="登录密码"
                :maxlength="26"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="用户昵称"
              name="nickName"
              v-bind="modalStateFrom.validateInfos.nickName"
            >
              <a-input
                v-model:value="modalState.from.nickName"
                allow-clear
                :maxlength="30"
                placeholder="请输入用户昵称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="用户性别" name="sex">
              <a-select
                v-model:value="modalState.from.sex"
                default-value="1"
                placeholder="用户性别"
                :options="dict.sysUserSex"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="6" :xs="24">
            <a-form-item label="用户状态" name="status">
              <a-select
                v-model:value="modalState.from.status"
                default-value="0"
                placeholder="用户状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="手机号码"
              name="phonenumber"
              v-bind="modalStateFrom.validateInfos.phonenumber"
            >
              <a-input
                v-model:value="modalState.from.phonenumber"
                allow-clear
                :maxlength="11"
                placeholder="请输入手机号码"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="电子邮箱"
              name="email"
              v-bind="modalStateFrom.validateInfos.email"
            >
              <a-input
                v-model:value="modalState.from.email"
                allow-clear
                :maxlength="40"
                placeholder="请输入电子邮箱"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="归属部门" name="deptId">
          <a-tree-select
            v-model:value="modalState.from.deptId"
            placeholder="归属部门"
            show-search
            tree-default-expand-all
            :tree-data="deptTreeData"
            :field-names="{
              children: 'children',
              label: 'label',
              value: 'id',
            }"
            tree-node-label-prop="label"
            tree-node-filter-prop="label"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          >
          </a-tree-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户岗位" name="postIds">
              <a-select
                v-model:value="modalState.from.postIds"
                allow-clear
                mode="multiple"
                placeholder="请选择用户岗位"
                show-search
                option-filter-prop="postName"
                option-label-prop="postName"
                :options="modalState.options.posts"
                :field-names="{ label: 'postName', value: 'postId' }"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户角色" name="roleIds">
              <a-select
                v-model:value="modalState.from.roleIds"
                allow-clear
                mode="multiple"
                placeholder="请选择用户角色"
                show-search
                option-filter-prop="roleName"
                option-label-prop="roleName"
                :options="modalState.options.roles"
                :field-names="{ label: 'roleName', value: 'roleId' }"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="用户说明" name="remark">
          <a-textarea
            v-model:value="modalState.from.remark"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="450"
            :show-count="true"
            placeholder="请输入用户说明"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重置密码修改框 -->
    <a-modal
      v-perms:has="['system:user:resetPwd']"
      width="500px"
      :keyboard="false"
      :mask-closable="false"
      :visible="modalState.visibleByResetPwd"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="fnModalOkResetPwd"
      @cancel="fnModalCancel"
    >
      <a-form name="modalStateFrom" layout="horizontal">
        <a-form-item
          label="登录账号"
          name="userName"
          v-bind="modalStateFrom.validateInfos.userName"
        >
          <a-input
            :value="modalState.from.userName"
            disabled
            placeholder="登录账号"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="登录密码"
          name="password"
          v-bind="modalStateFrom.validateInfos.password"
        >
          <a-input-password
            v-model:value="modalState.from.password"
            placeholder="登录密码"
            :maxlength="26"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
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
