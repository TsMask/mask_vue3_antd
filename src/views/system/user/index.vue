<script setup lang="ts">
import { Dayjs } from 'dayjs';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Modal, Form } from 'ant-design-vue/lib';
import type { SizeType } from 'ant-design-vue/lib/config-provider';
import type { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import type { ColumnsType } from 'ant-design-vue/es/table';
import UploadModal from '@/components/UploadModal/index.vue';
import {
  importData,
  importTemplate,
  exportUser,
  changeUserStatus,
  listUser,
  resetUserPwd,
  delUser,
  getUser,
  updateUser,
  addUser,
} from '@/api/system/user';
import { deptTree } from '@/api/system/dept';
import { saveAs } from 'file-saver';
import { parseDateToStr } from '@/utils/date-utils';
import {
  regExpPassword,
  regExpMobile,
  regExpNick,
  regExpEmail,
  regExpUserName,
} from '@/utils/regular-utils';
import useDictStore from '@/store/modules/dict';
import useUserStore from '@/store/modules/user';
import { DataNode } from 'ant-design-vue/lib/tree';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system-constants';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { uploadFile } from '@/api/tool/file';
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
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/**查询参数 */
let queryParams = reactive({
  /**登录账号 */
  userName: '',
  /**手机号 */
  phone: '',
  /**部门ID */
  deptId: '',
  /**用户状态 */
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
    userName: '',
    phone: '',
    deptId: '',
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
    title: '用户编号',
    dataIndex: 'userId',
    align: 'left',
    width: 100,
  },
  {
    title: '登录账号',
    dataIndex: 'userName',
    align: 'left',
    width: 100,
  },
  {
    title: '用户昵称',
    dataIndex: 'nickName',
    align: 'left',
    width: 100,
  },
  {
    title: '手机号码',
    dataIndex: 'phone',
    align: 'left',
    width: 120,
  },
  {
    title: '部门名称',
    dataIndex: 'deptId',
    key: 'deptId',
    align: 'left',
    width: 100,
  },
  {
    title: '登录地址',
    dataIndex: 'loginIp',
    key: 'loginIp',
    align: 'left',
    width: 100,
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '用户状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '操作',
    key: 'userId',
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

type OptionsType = {
  /**岗位选择列表 */
  posts: Record<string, any>[];
  /**角色选择列表 */
  roles: Record<string, any>[];
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
  form: Record<string, any>;
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
  form: {
    userId: undefined,
    userName: '',
    password: '',
    deptId: '100',
    email: '',
    loginDate: 0,
    loginIp: '',
    nickName: '',
    phone: '',
    postIds: [],
    roleIds: [],
    sex: '1',
    statusFlag: '0',
    remark: '',
    createTime: 0,
  },
  confirmLoading: false,
  options: {
    posts: [],
    roles: [],
  },
});

/**对话框内表单属性和校验规则 */
const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    userName: [
      {
        required: true,
        pattern: regExpUserName,
        message: '账号只能包含大写小写字母，数字，且不少于4位',
      },
    ],
    password: [
      {
        required: true,
        pattern: regExpPassword,
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
    phone: [
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
  getUser(userId)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        const roles = res.data.roles.map((m: Record<string, any>) => {
          const disabled = m.statusFlag === '0';
          Reflect.set(m, 'disabled', disabled);
          return m;
        });
        const posts = res.data.posts.map((m: Record<string, any>) => {
          const disabled = m.statusFlag === '0';
          Reflect.set(m, 'disabled', disabled);
          return m;
        });
        modalState.options.roles = roles;
        modalState.options.posts = posts;
        const { user, roleIds, postIds } = res.data;
        Object.assign(modalState.form, user);
        modalState.form.roleIds = roleIds;
        modalState.form.postIds = postIds;
        // 头像解析
        modalState.form.avatar = useUserStore().fnAvatar(
          modalState.form.avatar
        );
        modalState.title = '用户信息';
        modalState.visibleByView = true;
      } else {
        message.error('获取用户信息失败', 3);
      }
    })
    .finally(() => {
      hide();
      modalState.confirmLoading = false;
    });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param userId 用户编号ID, 不传为新增
 */
function fnModalVisibleByEdit(userId?: string | number) {
  if (!userId) {
    modalStateForm.resetFields();
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    // 查询用户详细获取岗位和角色列表
    getUser()
      .then(res => {
        if (res.code === RESULT_CODE_SUCCESS && res.data) {
          const roles = res.data.roles.map((m: Record<string, any>) => {
            const disabled = m.statusFlag === '0';
            Reflect.set(m, 'disabled', disabled);
            return m;
          });
          const posts = res.data.posts.map((m: Record<string, any>) => {
            const disabled = m.statusFlag === '0';
            Reflect.set(m, 'disabled', disabled);
            return m;
          });
          modalState.options.roles = roles;
          modalState.options.posts = posts;
          const { user, roleIds, postIds } = res.data;
          Object.assign(modalState.form, user);
          modalState.form.roleIds = roleIds;
          modalState.form.postIds = postIds;
          modalState.title = '添加用户信息';
          modalState.visibleByEdit = true;
        } else {
          message.error('获取用户信息失败', 3);
        }
      })
      .finally(() => {
        hide();
        modalState.confirmLoading = false;
      });
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getUser(userId)
      .then(res => {
        if (res.code === RESULT_CODE_SUCCESS && res.data) {
          const roles = res.data.roles.map((m: Record<string, any>) => {
            const disabled = m.statusFlag === '0';
            Reflect.set(m, 'disabled', disabled);
            return m;
          });
          const posts = res.data.posts.map((m: Record<string, any>) => {
            const disabled = m.statusFlag === '0';
            Reflect.set(m, 'disabled', disabled);
            return m;
          });
          modalState.options.roles = roles;
          modalState.options.posts = posts;
          const { user, roleIds, postIds } = res.data;
          Object.assign(modalState.form, user);
          modalState.form.roleIds = roleIds;
          modalState.form.postIds = postIds;
          modalState.title = '修改用户信息';
          modalState.visibleByEdit = true;
        } else {
          message.error(`获取用户信息失败`, 3);
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
  let validateName = ['nickName', 'email', 'phone'];
  if (!modalState.form.userId) {
    validateName.push('userName', 'password');
  }
  modalStateForm
    .validate(validateName)
    .then(() => {
      const hide = message.loading('请稍等...', 0);
      modalState.confirmLoading = true;
      const form = toRaw(modalState.form);
      const user = form.userId ? updateUser(form) : addUser(form);
      user
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
  modalState.visibleByResetPwd = false;
  modalStateForm.resetFields();
  modalState.options.roles = [];
  modalState.options.posts = [];
}

/**
 * 对话框弹出重置密码确认执行函数
 * 进行表达规则校验
 */
function fnModalOkResetPwd() {
  modalStateForm
    .validate(['userName', 'password'])
    .then(() => {
      const hide = message.loading('请稍等...', 0);
      modalState.confirmLoading = true;
      resetUserPwd(modalState.form.userId, modalState.form.password)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${modalState.title}成功`,
              duration: 3,
            });
            modalState.visibleByResetPwd = false;
            modalStateForm.resetFields();
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
 * 对话框弹出显示为 用户重置密码
 * @param row 用户记录对象
 */
function fnRecordResetPwd(row: Record<string, string>) {
  modalStateForm.resetFields();
  modalState.form.userId = row.userId;
  modalState.form.userName = row.userName;
  modalState.title = '重置密码';
  modalState.visibleByResetPwd = true;
}

/**
 * 用户状态修改
 * @param row 用户记录对象
 */
function fnRecordStatus(row: Record<string, string>) {
  const text = row.statusFlag === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.userName} 用户吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      changeUserStatus(row.userId, row.statusFlag)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${row.userName} ${text}成功`,
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
    onCancel() {
      row.statusFlag = row.statusFlag === '1' ? '0' : '1';
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
      const hide = message.loading('请稍等...', 0);
      delUser(userId)
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
      exportUser(toRaw(queryParams))
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `已完成导出`,
              duration: 3,
            });
            saveAs(res.data, `user_${Date.now()}.xlsx`);
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

/**对话框表格信息导入对象信息状态类型 */
type ModalUploadImportStateType = {
  /**是否显示 */
  visible: boolean;
  /**标题 */
  title: string;
  /**是否上传中 */
  loading: boolean;
  /**是否更新已经存在的数据 */
  updateSupport: boolean;
  /**上传结果信息 */
  msg: string;
  /**导入模板下载触发 */
  templateDownload: boolean;
};

/**对话框表格信息导入对象信息状态 */
let uploadImportState: ModalUploadImportStateType = reactive({
  open: false,
  title: '用户导入',
  loading: false,
  updateSupport: false,
  msg: '',
  templateDownload: false,
});

/**对话框表格信息导入弹出窗口 */
function fnModalUploadImportOpen() {
  uploadImportState.updateSupport = false;
  uploadImportState.msg = '';
  uploadImportState.visible = true;
}

/**对话框表格信息导入关闭窗口 */
function fnModalUploadImportClose() {
  uploadImportState.visible = false;
}

/**对话框表格信息导入上传 */
function fnModalUploadImportUpload(file: File) {
  // 发送请求
  const hide = message.loading('正在上传并解析数据...', 0);
  uploadImportState.loading = true;
  let formData = new FormData();
  formData.append('file', file);
  formData.append('subPath', 'import');
  uploadFile(formData)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        return res.data.filePath;
      }
      return '';
    })
    .then(filePath => {
      if (filePath === '') return undefined;
      return importData(filePath, uploadImportState.updateSupport);
    })
    .then(res => {
      if (res === undefined) return;
      if (res.code === RESULT_CODE_SUCCESS) {
        uploadImportState.msg = res.msg?.replaceAll(/<br\/>+/g, '\r');
      } else {
        message.error(res.msg, 3);
      }
    })
    .finally(() => {
      hide();
      uploadImportState.loading = false;
    });
}

/**对话框表格信息导入模板 */
function fnModalUploadImportExportTemplate() {
  if (uploadImportState.templateDownload) return;
  uploadImportState.templateDownload = true;
  const hide = message.loading('正在下载...', 0);
  importTemplate()
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        message.success({
          content: `成功读取并下载导入模板`,
          duration: 3,
        });
        saveAs(res.data, `user_template_${Date.now()}.xlsx`);
      } else {
        message.error({
          content: `${res.msg}`,
          duration: 3,
        });
      }
    })
    .finally(() => {
      hide();
      uploadImportState.templateDownload = false;
    });
}

/**查询用户列表, pageNum初始页数 */
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

  listUser(toRaw(queryParams)).then(res => {
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

/**初始部门树数据 */
let deptTreeData = ref<DataNode[]>([]);

/**查询部门下拉树结构 */
function fnGetDeptTree() {
  if (deptTreeData.value.length > 0) return;
  deptTree().then(res => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
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
  <PageContainer :title="title">
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
        <a-row>
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
        <a-row>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input
                v-model:value="queryParams.userName"
                allow-clear
                :maxlength="30"
                placeholder="请输入登录账号"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phone">
              <a-input
                v-model:value="queryParams.phone"
                allow-clear
                :maxlength="11"
                placeholder="请输入手机号码"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
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
            <a-form-item label="登录时间" name="queryRangePicker">
              <a-range-picker
                v-model:value="queryRangePicker"
                :bordered="true"
                :allow-clear="true"
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
            @click.prevent="fnModalUploadImportOpen()"
            v-perms:has="['system:user:import']"
          >
            <template #icon><ImportOutlined /></template>
            导入
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="fnExportList()"
            v-perms:has="['system:user:export']"
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
        row-key="userId"
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
          <template v-if="column.key === 'deptId'">
            {{ record.dept?.deptName }}
          </template>
          <template v-if="column.key === 'statusFlag'">
            <a-switch
              v-if="
                dict.sysNormalDisable.length > 0 &&
                !record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)
              "
              v-perms:has="['system:user:edit']"
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
          <template v-if="column.key === 'userId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalOpenByVive(record.userId)"
                  v-perms:has="['system:user:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip
                placement="topRight"
                v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)"
              >
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.userId)"
                  v-perms:has="['system:user:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip
                placement="topRight"
                v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)"
              >
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.userId)"
                  v-perms:has="['system:user:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip
                placement="topRight"
                v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)"
              >
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
    <ProModal
      :drag="true"
      :width="800"
      :visible="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户编号" name="userId">
              {{ modalState.form.userId }}
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
            <a-form-item label="登录地址" name="loginIp">
              {{ modalState.form.loginIp }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录时间" name="loginTime">
              <span v-if="+modalState.form.loginTime > 0">
                {{ parseDateToStr(+modalState.form.loginTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户头像" name="avatar">
              <a-avatar
                shape="circle"
                size="default"
                :src="modalState.form.avatar"
                :alt="modalState.form.userName"
              ></a-avatar>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              {{ modalState.form.userName }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户昵称" name="nickName">
              {{ modalState.form.nickName }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="sex">
              <DictTag
                :options="dict.sysUserSex"
                :value="modalState.form.sex"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phone">
              {{ modalState.form.phone }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="电子邮箱" name="email">
              {{ modalState.form.email }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="归属部门"
          name="deptId"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            :value="modalState.form.deptId"
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
                :value="modalState.form.postIds"
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
          <a-col
            :lg="12"
            :md="12"
            :xs="24"
            v-if="!modalState.form.roleIds?.includes(SYS_ROLE_SYSTEM_ID)"
          >
            <a-form-item label="用户角色" name="roleIds">
              <a-select
                :value="modalState.form.roleIds"
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

        <a-form-item
          label="用户说明"
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
      :open="modalState.openByEdit"
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
        <a-row :gutter="16" v-if="!modalState.form.userId">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="登录账号"
              name="userName"
              v-bind="modalStateForm.validateInfos.userName"
            >
              <a-input
                v-model:value="modalState.form.userName"
                allow-clear
                :maxlength="30"
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
              v-bind="modalStateForm.validateInfos.password"
            >
              <a-input-password
                v-model:value="modalState.form.password"
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

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="用户昵称"
              name="nickName"
              v-bind="modalStateForm.validateInfos.nickName"
            >
              <a-input
                v-model:value="modalState.form.nickName"
                allow-clear
                :maxlength="30"
                placeholder="请输入用户昵称"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="sex">
              <a-select
                v-model:value="modalState.form.sex"
                default-value="1"
                placeholder="用户性别"
                :options="dict.sysUserSex"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="用户状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="手机号码"
              name="phone"
              v-bind="modalStateForm.validateInfos.phone"
            >
              <a-input
                v-model:value="modalState.form.phone"
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
              v-bind="modalStateForm.validateInfos.email"
            >
              <a-input
                v-model:value="modalState.form.email"
                allow-clear
                :maxlength="40"
                placeholder="请输入电子邮箱"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="归属部门"
          name="deptId"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            v-model:value="modalState.form.deptId"
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
                v-model:value="modalState.form.postIds"
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
                v-model:value="modalState.form.roleIds"
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

        <a-form-item
          label="用户说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="450"
            :show-count="true"
            placeholder="请输入用户说明"
          />
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 重置密码修改框 -->
    <ProModal
      :drag="true"
      :keyboard="false"
      :mask-closable="false"
      :visible="modalState.visibleByResetPwd"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="fnModalOkResetPwd"
      @cancel="fnModalCancel"
    >
      <a-form name="modalStateFormByResetPwd" layout="horizontal">
        <a-form-item
          label="登录账号"
          name="userName"
          v-bind="modalStateForm.validateInfos.userName"
        >
          <a-input
            :value="modalState.form.userName"
            disabled
            :maxlength="30"
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
          v-bind="modalStateForm.validateInfos.password"
        >
          <a-input-password
            v-model:value="modalState.form.password"
            placeholder="登录密码"
            :maxlength="26"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 上传导入表格数据文件框 -->
    <UploadModal
      :title="uploadImportState.title"
      :loading="uploadImportState.loading"
      @upload="fnModalUploadImportUpload"
      @close="fnModalUploadImportClose"
      v-model:visible="uploadImportState.visible"
      :ext="['.xls', '.xlsx']"
      :size="10"
    >
      <template #default>
        <a-row justify="space-between" align="middle">
          <a-col :span="12">
            <a-checkbox v-model:checked="uploadImportState.updateSupport">
              是否更新已经存在的数据
            </a-checkbox>
          </a-col>
          <a-col :span="6">
            <a-button
              type="link"
              title="下载模板"
              @click.prevent="fnModalUploadImportExportTemplate"
            >
              下载模板
            </a-button>
          </a-col>
        </a-row>
        <a-textarea
          :disabled="true"
          :hidden="!uploadImportState.msg"
          :value="uploadImportState.msg"
          :auto-size="{ minRows: 2, maxRows: 8 }"
        />
      </template>
    </UploadModal>
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
