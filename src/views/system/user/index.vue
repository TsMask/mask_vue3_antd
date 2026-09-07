<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, computed, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Form } from 'ant-design-vue';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import UploadModal from '@/components/UploadModal/index.vue';
import {
  importData,
  importTemplate,
  exportUser,
  changeStatus,
  listUser,
  resetPassword,
  delUser,
  getUser,
  updateUser,
  addUser,
  unlock,
} from '@/api/system/user';
import { deptTree } from '@/api/system/dept';
import { uploadFile } from '@/api/tool/file';
import { saveAs } from 'file-saver';
import {
  regExpPassword,
  regExpMobile,
  regExpNick,
  regExpEmail,
  regExpUserName,
} from '@/utils/regular-utils';
import { parseDateToStr } from '@/utils/date-utils';
import { isSuccess } from '@/plugins/http-fetch';
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system-constants';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

// ==================== 字典 ====================

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysUserGender: 'sys_user_gender',
  },
});

// ==================== 查询 / 分页 / 列表 ====================

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
  queryFn: listUser,
  defaultPageSize: 20,
  rowKey: 'id',
});

// ==================== 部门树 ====================

const deptTreeData = ref<Record<string, any>[]>([]);

// ==================== 表格列 ====================

/** 表格展示列，只描述列表区域 */
const tableColumns = computed<ProColumns[]>(() => [
  { title: '用户编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'user_name', align: 'left', width: 100 },
  { title: '用户昵称', dataIndex: 'user_nick', align: 'left', width: 100 },
  { title: '手机号码', dataIndex: 'user_phone', align: 'left', width: 120 },
  {
    title: '部门名称',
    dataIndex: 'dept_id',
    key: 'dept_id',
    align: 'left',
    width: 100,
  },
  {
    title: '登录地址',
    dataIndex: 'user_login_ip',
    key: 'user_login_ip',
    align: 'left',
    width: 100,
  },
  {
    title: '登录时间',
    dataIndex: 'user_login_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    key: 'user_status',
    align: 'left',
    width: 100,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 210,
    fixed: 'right',
  },
]);

/** 查询表单项，独立于表格展示列 */
const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '登录账号', dataIndex: 'user_name', fieldProps: { maxlength: 30 } },
  { title: '手机号码', dataIndex: 'user_phone', fieldProps: { maxlength: 11 } },
  {
    title: '用户状态',
    dataIndex: 'user_status',
    key: 'user_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '部门名称',
    dataIndex: 'dept_id',
    key: 'dept_id',
    valueType: 'treeSelect',
    colSize: 2,
    fieldProps: {
      treeData: deptTreeData.value,
      fieldNames: { children: 'children', label: 'label', value: 'id' },
      treeDefaultExpandAll: true,
      allowClear: true,
      style: { width: '100%' },
    },
  },
  {
    title: '登录时间范围',
    dataIndex: 'login_time',
    valueType: 'dateTimeRange',
    colSize: 2,
    searchTransform(value: any[]) {
      return {
        login_time_begin: value?.[0]?.valueOf(),
        login_time_end: value?.[1]?.valueOf(),
      };
    },
  },
]);

// ==================== 查看 / 编辑表单弹窗 ====================

const {
  modal,
  formCtl,
  isView,
  openModal,
  closeModal: closeCrudModal,
} = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined,
    user_name: '',
    password: '',
    dept_id: '100',
    user_email: '',
    loginDate: 0,
    user_login_ip: '',
    user_nick: '',
    user_phone: '',
    post_ids: [] as (string | number)[],
    role_ids: [] as (string | number)[],
    user_gender: '0',
    user_status: '0',
    remark: '',
    create_time: 0,
    user_avatar: '',
    user_login_time: 0,
  }),
  rules: {
    user_name: [
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
    user_nick: [
      {
        required: true,
        pattern: regExpNick,
        message: '昵称只能包含字母、数字、中文和下划线，且不少于2位',
      },
    ],
    user_email: [
      {
        required: false,
        pattern: regExpEmail,
        message: '请输入正确的邮箱地址',
      },
    ],
    user_phone: [
      {
        required: false,
        pattern: regExpMobile,
        message: '请输入正确的手机号码',
      },
    ],
  },
});

/** 表单选项（岗位、角色下拉列表） */
const formOptions = reactive<{
  posts: Record<string, any>[];
  roles: Record<string, any>[];
}>({
  posts: [],
  roles: [],
});

/** 从 getUser 响应中同步岗位/角色下拉选项 */
function applyUserFormOptions(resData: any) {
  formOptions.roles = resData.roles.map((m: Record<string, any>) => {
    m.disabled = m.role_status === '0';
    return m;
  });
  formOptions.posts = resData.posts.map((m: Record<string, any>) => {
    m.disabled = m.post_status === '0';
    return m;
  });
}

/** 从 getUser 响应中提取表单字段，选项数据保留给 beforeOpen 处理 */
function transformUserDetail(resData: any) {
  const { user, role_ids, post_ids } = resData;
  return { ...user, role_ids, post_ids };
}

/** 打开详情弹窗 */
function handleView(user_id: string | number) {
  if (!user_id) return;
  openModal({
    mode: 'view',
    title: '用户信息',
    fetchDetail: () => getUser(user_id),
    transformDetail: transformUserDetail,
    beforeOpen(form, data) {
      if (!data) return;
      applyUserFormOptions(data);
      form.user_avatar = userStore.fnAvatar(form.user_avatar);
    },
  });
}

/** 打开新增/编辑弹窗 */
function handleOpenEdit(user_id?: string | number) {
  const defaultDept = deptTreeData.value[0];
  openModal({
    mode: user_id ? 'edit' : 'add',
    title: user_id ? '修改用户信息' : '添加用户信息',
    initialData:
      !user_id && defaultDept ? { dept_id: defaultDept.id } : undefined,
    fetchDetail: () => getUser(user_id || 0),
    transformDetail: transformUserDetail,
    beforeOpen(form, data) {
      if (!data) return;
      applyUserFormOptions(data);
    },
  });
}

/** 新增/编辑提交 */
const {
  confirmAction,
  executeAction,
  loading: isSubmitting,
} = useModalAction();

async function handleSubmit() {
  const validateNames = ['user_nick', 'user_email', 'user_phone'];
  if (!modal.form.id) {
    validateNames.push('user_name', 'password');
  }
  try {
    await formCtl.validate(validateNames);
  } catch (e: any) {
    message.error({
      content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }
  current.value = 1;
  const form = toRaw(modal.form);
  await executeAction({
    action: () => (form.id ? updateUser(form) : addUser(form)),
    successText: '操作成功',
    onSuccess: () => {
      handleCrudCancel();
      reload();
    },
  });
}

function handleCrudCancel() {
  closeCrudModal();
  formOptions.roles = [];
  formOptions.posts = [];
}

// ==================== 重置密码弹窗（独立表单） ====================

const resetPwdVisible = ref(false);
const resetPwdTitle = '重置密码';
const resetPwdForm = reactive({
  user_id: undefined as string | number | undefined,
  user_name: '',
  password: '',
});
const resetPwdFormCtl = Form.useForm(
  resetPwdForm,
  reactive({
    password: [
      {
        required: true,
        pattern: regExpPassword,
        message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
      },
    ],
  })
);

const { executeAction: executeResetPwd, loading: isResetPwdSubmitting } =
  useModalAction();

function handleOpenResetPwd(row: Record<string, any>) {
  resetPwdFormCtl.resetFields();
  resetPwdForm.user_id = row.id;
  resetPwdForm.user_name = row.user_name;
  resetPwdVisible.value = true;
}

function handleResetPwdCancel() {
  resetPwdVisible.value = false;
  resetPwdFormCtl.resetFields();
}

async function handleResetPwdSubmit() {
  try {
    await resetPwdFormCtl.validate();
  } catch (e: any) {
    message.error({
      content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }
  await executeResetPwd({
    action: () => resetPassword(resetPwdForm.user_id!, resetPwdForm.password),
    successText: '重置密码成功',
    onSuccess: () => {
      resetPwdVisible.value = false;
      resetPwdFormCtl.resetFields();
    },
  });
}

// ==================== 列表操作 ====================

/** 状态修改（取消确认时回滚开关状态） */
function handleStatusChange(row: Record<string, any>) {
  const text = row.user_status === '1' ? '启用' : '停用';
  confirmAction({
    content: `确定要${text} ${row.user_name} 用户吗?`,
    action: () => changeStatus(row.id, row.user_status),
    successText: `${row.user_name} ${text}成功`,
    onSuccess() {
      reload();
    },
    onCancel() {
      row.user_status = row.user_status === '1' ? '0' : '1';
    },
  });
}

function handleDelete(user_id: string = '0') {
  const id = user_id === '0' ? selectedRowKeys.value.join(',') : user_id;
  confirmAction({
    content: `确认删除用户编号为 【${id}】 的数据项?`,
    action: () => delUser(id),
    successText: '删除成功',
    onSuccess() {
      removeSelectedRowKeys(String(id).split(',').map(Number));
      reload();
    },
  });
}

function handleUnlock(user_name: string) {
  confirmAction({
    content: `确认解锁用户 ${user_name} ?`,
    action: () => unlock(user_name),
    successText: `用户 ${user_name} 解锁成功`,
  });
}

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () => {
      return exportUser({
        ...toRaw(searchValues.value),
        page_num: current.value,
        page_size: pageSize.value,
      });
    },
    successText: '已完成导出',
    onSuccess: res => saveAs(res.data, `user_${Date.now()}.csv`),
  });
}

// ==================== 导入 ====================

const importState = reactive({
  open: false,
  title: '用户导入',
  loading: false,
  updateSupport: false,
  msg: '',
  templateDownload: false,
});

function handleOpenImport() {
  importState.updateSupport = false;
  importState.msg = '';
  importState.open = true;
}

function handleCloseImport() {
  importState.open = false;
}

async function handleImportUpload(file: File) {
  const hide = message.loading('正在上传并解析数据...', 0);
  importState.loading = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subPath', 'import');
    const uploadRes = await uploadFile(formData);
    if (!isSuccess(uploadRes)) {
      message.error(uploadRes.msg, 3);
      return;
    }
    const filePath = uploadRes.data.file_path;
    const importRes = await importData(filePath, importState.updateSupport);
    if (isSuccess(importRes)) {
      importState.msg = importRes.msg?.replaceAll(/<br\/>+/g, '\r');
      current.value = 1;
      reload();
    } else {
      message.error(importRes.msg, 3);
    }
  } finally {
    hide();
    importState.loading = false;
  }
}

async function handleDownloadTemplate() {
  if (importState.templateDownload) return;
  importState.templateDownload = true;
  try {
    const res = await importTemplate();
    if (isSuccess(res)) {
      saveAs(res.data, `user_template_${Date.now()}.csv`);
    }
  } finally {
    importState.templateDownload = false;
  }
}

// ==================== 初始化 ====================

onMounted(() => {
  deptTree().then(res => {
    if (isSuccess(res) && Array.isArray(res.data)) {
      deptTreeData.value = res.data;
    }
  });
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 所有系统用户管理列表 </a-typography-paragraph>
    </template>

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
        setting: { columnsStateKey: 'system-user', columnsStateType: 'local' },
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
            @click.prevent="handleOpenEdit()"
            v-perms:has="['system:user:add']"
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
            v-perms:has="['system:user:remove']"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleOpenImport()"
            v-perms:has="['system:user:import']"
          >
            <template #icon>
              <ImportOutlined />
            </template>
            导入
          </a-button>
          <a-button
            type="dashed"
            @click.prevent="handleExport()"
            v-perms:has="['system:user:export']"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dept_id'">
          {{ record.dept?.dept_name }}
        </template>
        <template v-if="column.key === 'user_status'">
          <a-switch
            v-if="
              dict.sysNormalDisable.length > 0 &&
              !record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)
            "
            v-perms:has="['system:user:edit']"
            v-model:checked="record.user_status"
            checked-value="1"
            :checked-children="dict.sysNormalDisable[1].label"
            un-checked-value="0"
            :un-checked-children="dict.sysNormalDisable[0].label"
            size="small"
            @change="handleStatusChange(record)"
          />
          <DictTag
            v-else
            :options="dict.sysNormalDisable"
            :value="record.user_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:user:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleOpenEdit(record.id)"
                v-perms:has="['system:user:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:user:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>重置密码</template>
              <a-button
                type="link"
                @click.prevent="handleOpenResetPwd(record)"
                v-perms:has="['system:user:resetPwd']"
              >
                <template #icon>
                  <SecurityScanOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)"
            >
              <template #title>解锁</template>
              <a-button
                type="link"
                @click.prevent="handleUnlock(record.user_name)"
                v-perms:has="['system:user:unlock']"
              >
                <template #icon>
                  <UnlockOutlined />
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
      :open="modal.visible"
      :title="modal.title"
      :confirm-loading="isSubmitting"
      :footer="isView ? null : undefined"
      @ok="handleSubmit"
      @cancel="handleCrudCancel"
    >
      <a-form
        name="formCtlByEdit"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
        :disabled="isView"
      >
        <a-row v-if="isView">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户编号" name="id">
              {{ modal.form.id }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="create_time">
              <span v-if="+modal.form.create_time > 0">
                {{ parseDateToStr(+modal.form.create_time) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="isView">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录地址" name="user_login_ip">
              {{ modal.form.user_login_ip || '-' }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录时间" name="user_login_time">
              <span v-if="+modal.form.user_login_time > 0">
                {{ parseDateToStr(+modal.form.user_login_time) }}
              </span>
              <span v-else>-</span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="isView">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户头像" name="user_avatar">
              <a-avatar
                shape="circle"
                size="default"
                :src="modal.form.user_avatar"
                :alt="modal.form.user_name"
              ></a-avatar>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="user_name">
              {{ modal.form.user_name }}
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="!modal.form.id">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="登录账号"
              name="user_name"
              v-bind="formCtl.validateInfos.user_name"
            >
              <a-input
                v-model:value="modal.form.user_name"
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
              v-bind="formCtl.validateInfos.password"
            >
              <a-input-password
                v-model:value="modal.form.password"
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
              name="user_nick"
              v-bind="formCtl.validateInfos.user_nick"
            >
              <a-input
                v-model:value="modal.form.user_nick"
                allow-clear
                :maxlength="30"
                placeholder="请输入用户昵称"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="user_gender">
              <a-select
                v-model:value="modal.form.user_gender"
                default-value="1"
                placeholder="用户性别"
                :options="dict.sysUserGender"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="user_status">
              <a-select
                v-model:value="modal.form.user_status"
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
              name="user_phone"
              v-bind="formCtl.validateInfos.user_phone"
            >
              <a-input
                v-model:value="modal.form.user_phone"
                allow-clear
                :maxlength="11"
                placeholder="请输入手机号码"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="电子邮箱"
              name="user_email"
              v-bind="formCtl.validateInfos.user_email"
            >
              <a-input
                v-model:value="modal.form.user_email"
                allow-clear
                :maxlength="40"
                placeholder="请输入电子邮箱"
              ></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="归属部门"
          name="dept_id"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            v-model:value="modal.form.dept_id"
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

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户岗位" name="post_ids">
              <a-select
                v-model:value="modal.form.post_ids"
                allow-clear
                mode="multiple"
                placeholder="请选择用户岗位"
                show-search
                option-filter-prop="post_name"
                option-label-prop="post_name"
                :options="formOptions.posts"
                :field-names="{ label: 'post_name', value: 'id' }"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户角色" name="role_ids">
              <a-select
                v-model:value="modal.form.role_ids"
                allow-clear
                mode="multiple"
                placeholder="请选择用户角色"
                show-search
                option-filter-prop="role_name"
                option-label-prop="role_name"
                :options="formOptions.roles"
                :field-names="{ label: 'role_name', value: 'id' }"
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
            v-model:value="modal.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="200"
            :show-count="!isView"
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
      :open="resetPwdVisible"
      :title="resetPwdTitle"
      :confirm-loading="isResetPwdSubmitting"
      @ok="handleResetPwdSubmit"
      @cancel="handleResetPwdCancel"
    >
      <a-form
        name="formCtlByResetPwd"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-form-item label="登录账号" name="user_name">
          <a-input
            :value="resetPwdForm.user_name"
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
          v-bind="resetPwdFormCtl.validateInfos.password"
        >
          <a-input-password
            v-model:value="resetPwdForm.password"
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
      :title="importState.title"
      :loading="importState.loading"
      @upload="handleImportUpload"
      @close="handleCloseImport"
      v-model:open="importState.open"
      :ext="['.csv']"
      :size="10"
    >
      <template #default>
        <a-row justify="space-between" align="middle">
          <a-col :span="12">
            <a-checkbox
              :disabled="importState.loading"
              v-model:checked="importState.updateSupport"
            >
              是否更新已经存在的数据
            </a-checkbox>
          </a-col>
          <a-col :span="6">
            <a-button
              type="link"
              title="下载模板"
              @click.prevent="handleDownloadTemplate"
            >
              下载模板
            </a-button>
          </a-col>
        </a-row>
        <a-textarea
          :disabled="true"
          :hidden="!importState.msg"
          :value="importState.msg"
          :auto-size="{ minRows: 2, maxRows: 8 }"
        />
      </template>
    </UploadModal>
  </PageContainer>
</template>

<style scoped></style>
