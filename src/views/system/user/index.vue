<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, watch, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Modal, Form } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'ant-design-vue/es/table';
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
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { useCrudModal } from '@/hooks/useCrudModal';
import { useAction, confirmAction } from '@/hooks/useAction';
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

const queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

function syncDateRange() {
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.begin_time = queryRangePicker.value[0].startOf('day').valueOf();
    queryParams.end_time = queryRangePicker.value[1].endOf('day').valueOf();
  } else {
    queryParams.begin_time = undefined;
    queryParams.end_time = undefined;
  }
}

const { queryParams, handleQuery, resetQuery } = useQueryParams(
  {
    user_name: '',
    user_phone: '',
    dept_id: '',
    user_status: undefined as string | undefined,
    begin_time: undefined as undefined | number,
    end_time: undefined as undefined | number,
    page_num: 1,
    page_size: 20,
  },
  () => {
    queryRangePicker.value = undefined;
    resetPage();
    fetchList();
  },
);

const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, page_size) => {
    queryParams.page_num = page;
    queryParams.page_size = page_size;
    fetchList();
  },
});

const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => { syncDateRange(); return listUser(toRaw(queryParams)); },
});

watch(loading, (newVal, oldVal) => {
  if (oldVal && !newVal) clearSelection();
});

const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } = useTableUI();

// ==================== 部门树 ====================

const deptTreeData = ref<Record<string, any>[]>([]);

// ==================== 表格列 ====================

const tableColumns: ColumnsType = [
  { title: '用户编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'user_name', align: 'left', width: 100 },
  { title: '用户昵称', dataIndex: 'user_nick', align: 'left', width: 100 },
  { title: '手机号码', dataIndex: 'user_phone', align: 'left', width: 120 },
  { title: '部门名称', dataIndex: 'dept_id', key: 'dept_id', align: 'left', width: 100 },
  { title: '登录地址', dataIndex: 'user_login_ip', key: 'user_login_ip', align: 'left', width: 100 },
  {
    title: '登录时间',
    dataIndex: 'user_login_time',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  { title: '用户状态', dataIndex: 'user_status', key: 'user_status', align: 'left', width: 100 },
  { title: '操作', key: 'id', align: 'left' },
];

// ==================== 查看 / 编辑弹窗 ====================

const { modal, formCtl, setForm, close: closeCrudModal } = useCrudModal({
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
      { required: true, pattern: regExpUserName, message: '账号只能包含大写小写字母，数字，且不少于4位' },
    ],
    password: [
      { required: true, pattern: regExpPassword, message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位' },
    ],
    user_nick: [
      { required: true, pattern: regExpNick, message: '昵称只能包含字母、数字、中文和下划线，且不少于2位' },
    ],
    user_email: [
      { required: false, pattern: regExpEmail, message: '请输入正确的邮箱地址' },
    ],
    user_phone: [
      { required: false, pattern: regExpMobile, message: '请输入正确的手机号码' },
    ],
  },
});

/** 表单选项（岗位、角色下拉列表） */
const formOptions = reactive<{ posts: Record<string, any>[]; roles: Record<string, any>[] }>({
  posts: [],
  roles: [],
});

/** 从 getUser 响应中解析用户数据、岗位/角色选项并填充表单 */
function applyUserDetail(resData: any) {
  formOptions.roles = resData.roles.map((m: Record<string, any>) => {
    m.disabled = m.role_status === '0';
    return m;
  });
  formOptions.posts = resData.posts.map((m: Record<string, any>) => {
    m.disabled = m.post_status === '0';
    return m;
  });
  const { user, role_ids, post_ids } = resData;
  setForm(user);
  modal.form.role_ids = role_ids;
  modal.form.post_ids = post_ids;
}

/** 打开详情弹窗 */
async function handleView(user_id: string | number) {
  if (!user_id || modal.confirmLoading) return;
  modal.confirmLoading = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const res = await getUser(user_id);
    if (isSuccess(res) && res.data) {
      applyUserDetail(res.data);
      modal.form.user_avatar = userStore.fnAvatar(modal.form.user_avatar);
      modal.title = '用户信息';
      modal.visibleByView = true;
    }
  } finally {
    hide();
    modal.confirmLoading = false;
  }
}

/** 打开新增/编辑弹窗 */
async function handleOpenEdit(user_id?: string | number) {
  if (modal.confirmLoading) return;
  modal.confirmLoading = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const fetchId = user_id || 0;
    const res = await getUser(fetchId);
    if (isSuccess(res) && res.data) {
      if (!user_id) formCtl.resetFields();
      applyUserDetail(res.data);
      if (!user_id && deptTreeData.value.length > 0) {
        modal.form.dept_id = deptTreeData.value[0].id;
      }
      modal.title = user_id ? '修改用户信息' : '添加用户信息';
      modal.visibleByEdit = true;
    }
  } finally {
    hide();
    modal.confirmLoading = false;
  }
}

/** 新增/编辑提交 */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (data: Record<string, any>) =>
    data.id ? updateUser(data) : addUser(data),
  successText: '操作成功',
  onSuccess: () => {
    handleCrudCancel();
    fetchList();
  },
});

async function handleSubmit() {
  const validateNames = ['user_nick', 'user_email', 'user_phone'];
  if (!modal.form.id) {
    validateNames.push('user_name', 'password');
  }
  try {
    await formCtl.validate(validateNames);
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  queryParams.page_num = 1;
  await submitExecute(toRaw(modal.form));
}

function handleCrudCancel() {
  closeCrudModal();
  formOptions.roles = [];
  formOptions.posts = [];
}

// ==================== 重置密码弹窗（独立表单） ====================

const resetPwdVisible = ref(false);
const resetPwdForm = reactive({
  user_id: undefined as string | number | undefined,
  user_name: '',
  password: '',
});
const resetPwdFormCtl = Form.useForm(resetPwdForm, reactive({
  password: [
    { required: true, pattern: regExpPassword, message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位' },
  ],
}));

const { execute: resetPwdExecute, loading: isResetPwdSubmitting } = useAction({
  action: (params: { user_id: string | number; password: string }) =>
    resetPassword(params.user_id, params.password),
  successText: '重置密码成功',
  onSuccess: () => {
    resetPwdVisible.value = false;
    resetPwdFormCtl.resetFields();
  },
});

function handleOpenResetPwd(row: Record<string, any>) {
  resetPwdFormCtl.resetFields();
  resetPwdForm.user_id = row.id;
  resetPwdForm.user_name = row.user_name;
  resetPwdVisible.value = true;
}

async function handleResetPwdSubmit() {
  try {
    await resetPwdFormCtl.validate();
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  await resetPwdExecute({ user_id: resetPwdForm.user_id!, password: resetPwdForm.password });
}

// ==================== 列表操作 ====================

/** 状态修改（保留 Modal.confirm 以支持取消回滚） */
function handleStatusChange(row: Record<string, any>) {
  const text = row.user_status === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.user_name} 用户吗?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      return changeStatus(row.id, row.user_status)
        .then((res) => {
          hide();
          if (isSuccess(res)) {
            message.success({ content: `${row.user_name} ${text}成功`, duration: 3 });
            fetchList();
          } else {
            message.error({ content: res.msg, duration: 3 });
          }
        })
        .catch((err) => {
          hide();
          message.error({ content: err.message || '操作失败', duration: 3 });
        });
    },
    onCancel() {
      row.user_status = row.user_status === '1' ? '0' : '1';
    },
  });
}

function handleDelete(user_id: string = '0') {
  const id = user_id === '0' ? tableState.selectedRowKeys.join(',') : user_id;
  confirmAction({
    content: `确认删除用户编号为 【${id}】 的数据项?`,
    action: () => delUser(id),
    variables: undefined,
    successText: '删除成功',
    onSuccess() {
      const deletedCount = String(id).split(',').length;
      if (!clampPage(deletedCount)) fetchList();
    },
  });
}

function handleUnlock(user_name: string) {
  confirmAction({
    content: `确认解锁用户 ${user_name} ?`,
    action: () => unlock(user_name),
    variables: undefined,
    successText: `用户 ${user_name} 解锁成功`,
  });
}

function handleExport() {
  confirmAction({
    content: '确认根据搜索条件导出数据文件吗?',
    action: () => exportUser(toRaw(queryParams)),
    variables: undefined,
    successText: '已完成导出',
    onSuccess: (res) => saveAs(res.data, `user_${Date.now()}.csv`),
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
    const filePath = uploadRes.data.filePath;
    const importRes = await importData(filePath, importState.updateSupport);
    if (isSuccess(importRes)) {
      importState.msg = importRes.msg?.replaceAll(/<br\/>+/g, '\r');
      fetchList();
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
  deptTree().then((res) => {
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

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="user_name">
              <a-input v-model:value="queryParams.user_name" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="user_phone">
              <a-input v-model:value="queryParams.user_phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="用户状态" name="user_status">
              <a-select v-model:value="queryParams.user_status" allow-clear placeholder="请选择"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="8" :md="12" :xs="24">
            <a-form-item label="登录时间" name="queryRangePicker">
              <a-range-picker v-model:value="queryRangePicker" :bordered="true" :allow-clear="true"
                style="width: 100%"></a-range-picker>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :lg="16" :md="12" :xs="24">
            <a-form-item label="部门名称" name="dept_id">
              <a-tree-select v-model:value="queryParams.dept_id" placeholder="部门名称" show-search tree-default-expand-all
                :tree-data="deptTreeData" :field-names="{
                  children: 'children',
                  label: 'label',
                  value: 'id',
                }" tree-node-label-prop="label" tree-node-filter-prop="label" style="width: 100%"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }">
              </a-tree-select>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="handleQuery">
                  <template #icon>
                    <SearchOutlined />
                  </template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <template #title>
        <a-space :size="8" align="center">
          <a-button type="primary" @click.prevent="handleOpenEdit()" v-perms:has="['system:user:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
          <a-button type="default" danger :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="handleDelete()" v-perms:has="['system:user:remove']">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
          <a-button type="dashed" @click.prevent="handleOpenImport()" v-perms:has="['system:user:import']">
            <template #icon>
              <ImportOutlined />
            </template>
            导入
          </a-button>
          <a-button type="dashed" @click.prevent="handleExport()" v-perms:has="['system:user:export']">
            <template #icon>
              <ExportOutlined />
            </template>
            导出
          </a-button>
        </a-space>
      </template>

      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.searched" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList">
              <template #icon>
                <ReloadOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon>
                  <ColumnHeightOutlined />
                </template>
              </a-button>
              <template #overlay>
                <a-menu :selected-keys="[tableState.size as string]" @click="setTableSize">
                  <a-menu-item key="default">默认</a-menu-item>
                  <a-menu-item key="middle">中等</a-menu-item>
                  <a-menu-item key="small">紧凑</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>

      <a-table class="antdv-table" row-key="id" :columns="tableColumns" :loading="loading" :data-source="listData"
        :size="tableState.size" :row-class-name="rowClassName" :pagination="{ ...pagination }" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dept_id'">
            {{ record.dept?.dept_name }}
          </template>
          <template v-if="column.key === 'user_status'">
            <a-switch v-if="
              dict.sysNormalDisable.length > 0 &&
              !record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)
            " v-perms:has="['system:user:edit']" v-model:checked="record.user_status" checked-value="1"
              :checked-children="dict.sysNormalDisable[0].label" un-checked-value="0"
              :un-checked-children="dict.sysNormalDisable[1].label" size="small" @change="handleStatusChange(record)" />
            <DictTag v-else :options="dict.sysNormalDisable" :value="record.user_status" />
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.id)" v-perms:has="['system:user:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleOpenEdit(record.id)" v-perms:has="['system:user:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.id)" v-perms:has="['system:user:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>重置密码</template>
                <a-button type="link" @click.prevent="handleOpenResetPwd(record)"
                  v-perms:has="['system:user:resetPwd']">
                  <template #icon>
                    <SecurityScanOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.role_ids?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>解锁</template>
                <a-button type="link" @click.prevent="handleUnlock(record.user_name)"
                  v-perms:has="['system:user:unlock']">
                  <template #icon>
                    <UnlockOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="modal.visibleByView" :title="modal.title" @cancel="handleCrudCancel">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
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
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录地址" name="user_login_ip">
              {{ modal.form.user_login_ip }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录时间" name="user_login_time">
              <span v-if="+modal.form.user_login_time > 0">
                {{ parseDateToStr(+modal.form.user_login_time) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户头像" name="user_avatar">
              <a-avatar shape="circle" size="default" :src="modal.form.user_avatar" :alt="modal.form.user_name"></a-avatar>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="user_name">
              {{ modal.form.user_name }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户昵称" name="user_nick">
              {{ modal.form.user_nick }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="user_gender">
              <DictTag :options="dict.sysUserGender" :value="modal.form.user_gender" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="user_status">
              <DictTag :options="dict.sysNormalDisable" :value="modal.form.user_status" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="手机号码" name="user_phone">
              {{ modal.form.user_phone }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="电子邮箱" name="user_email">
              {{ modal.form.user_email }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="归属部门" name="dept_id" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select :value="modal.form.dept_id" placeholder="归属部门" disabled :tree-data="deptTreeData" :field-names="{
            children: 'children',
            label: 'label',
            value: 'id',
          }" tree-node-label-prop="label" style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }">
            <template #suffixIcon></template>
          </a-tree-select>
        </a-form-item>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户岗位" name="post_ids">
              <a-select :value="modal.form.post_ids" :disabled="true" mode="multiple" placeholder="请选择用户岗位"
                option-label-prop="post_name" :options="formOptions.posts"
                :field-names="{ label: 'post_name', value: 'id' }">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24" v-if="!modal.form.role_ids?.includes(SYS_ROLE_SYSTEM_ID)">
            <a-form-item label="用户角色" name="role_ids">
              <a-select :value="modal.form.role_ids" disabled mode="multiple" placeholder="请选择用户角色"
                option-label-prop="role_name" :options="formOptions.roles"
                :field-names="{ label: 'role_name', value: 'id' }">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="用户说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="modal.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCrudCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="modal.visibleByEdit" :title="modal.title" :confirm-loading="isSubmitting" @ok="handleSubmit"
      @cancel="handleCrudCancel">
      <a-form name="formCtlByEdit" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row v-if="!modal.form.id">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="user_name" v-bind="formCtl.validateInfos.user_name">
              <a-input v-model:value="modal.form.user_name" allow-clear :maxlength="30" placeholder="请输入登录账号">
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录密码" name="password" v-bind="formCtl.validateInfos.password">
              <a-input-password v-model:value="resetPwdForm.password" placeholder="登录密码" :maxlength="26">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户昵称" name="user_nick" v-bind="formCtl.validateInfos.user_nick">
              <a-input v-model:value="modal.form.user_nick" allow-clear :maxlength="30" placeholder="请输入用户昵称"></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="user_gender">
              <a-select v-model:value="modal.form.user_gender" default-value="1" placeholder="用户性别" :options="dict.sysUserGender">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="user_status">
              <a-select v-model:value="modal.form.user_status" default-value="0" placeholder="用户状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="手机号码" name="user_phone" v-bind="formCtl.validateInfos.user_phone">
              <a-input v-model:value="modal.form.user_phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="电子邮箱" name="user_email" v-bind="formCtl.validateInfos.user_email">
              <a-input v-model:value="modal.form.user_email" allow-clear :maxlength="40" placeholder="请输入电子邮箱"></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="归属部门" name="dept_id" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select v-model:value="modal.form.dept_id" placeholder="归属部门" show-search tree-default-expand-all
            :tree-data="deptTreeData" :field-names="{
              children: 'children',
              label: 'label',
              value: 'id',
            }" tree-node-label-prop="label" tree-node-filter-prop="label" style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }">
          </a-tree-select>
        </a-form-item>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户岗位" name="post_ids">
              <a-select v-model:value="modal.form.post_ids" allow-clear mode="multiple" placeholder="请选择用户岗位" show-search
                option-filter-prop="post_name" option-label-prop="post_name" :options="formOptions.posts"
                :field-names="{ label: 'post_name', value: 'id' }">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户角色" name="role_ids">
              <a-select v-model:value="modal.form.role_ids" allow-clear mode="multiple" placeholder="请选择用户角色" show-search
                option-filter-prop="role_name" option-label-prop="role_name" :options="formOptions.roles"
                :field-names="{ label: 'role_name', value: 'id' }">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="用户说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modal.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入用户说明" />
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 重置密码修改框 -->
    <ProModal :drag="true" :keyboard="false" :mask-closable="false" :open="resetPwdVisible" :title="modal.title"
      :confirm-loading="isResetPwdSubmitting" @ok="handleResetPwdSubmit" @cancel="handleCrudCancel">
      <a-form name="formCtlByResetPwd" layout="horizontal">
        <a-form-item label="登录账号" name="user_name" v-bind="formCtl.validateInfos.user_name">
          <a-input :value="resetPwdForm.user_name" disabled :maxlength="30" placeholder="登录账号">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="登录密码" name="password" v-bind="formCtl.validateInfos.password">
          <a-input-password v-model:value="modal.form.password" placeholder="登录密码" :maxlength="26">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 上传导入表格数据文件框 -->
    <UploadModal :title="importState.title" :loading="importState.loading" @upload="handleImportUpload"
      @close="handleCloseImport" v-model:open="importState.open" :ext="['.csv']" :size="10">
      <template #default>
        <a-row justify="space-between" align="middle">
          <a-col :span="12">
            <a-checkbox :disabled="importState.loading" v-model:checked="importState.updateSupport">
              是否更新已经存在的数据
            </a-checkbox>
          </a-col>
          <a-col :span="6">
            <a-button type="link" title="下载模板" @click.prevent="handleDownloadTemplate">
              下载模板
            </a-button>
          </a-col>
        </a-row>
        <a-textarea :disabled="true" :hidden="!importState.msg" :value="importState.msg"
          :auto-size="{ minRows: 2, maxRows: 8 }" />
      </template>
    </UploadModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.antdv-table :deep(.antdv-striped) td {
  background-color: #fafafa;
}

.antdv-table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
