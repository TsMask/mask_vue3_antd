<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
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
import { SYS_ROLE_SYSTEM_ID } from '@/constants/system-constants';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useTableUI } from '@/hooks/useTableUI';
import { usePagination } from '@/hooks/usePagination';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useMessageAction } from '@/hooks/useMessageAction';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const route = useRoute();

/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict, loadDicts } = useDictSetup({
  sysNormalDisable: 'sys_normal_disable',
  sysUserSex: 'sys_user_sex',
});

/** 通用操作反馈 */
const { withLoading, confirmAndRun } = useMessageAction();

/** 开始结束时间 */
let queryRangePicker = ref<[Dayjs, Dayjs] | undefined>();

/** 查询参数 */
const { queryParams, resetQuery } = useQueryParams(
  {
    userName: '',
    phone: '',
    deptId: '',
    statusFlag: undefined,
    beginTime: undefined as undefined | number,
    endTime: undefined as undefined | number,
    pageNum: 1,
    pageSize: 20,
  },
  () => {
    queryRangePicker.value = undefined;
    resetPage();
    fetchList();
  },
);

/** 分页管理 */
const { pagination, resetPage, setTotal, fixPageAfterDelete } = usePagination({
  onChange: (page, pageSize) => {
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fetchList();
  },
});

/** 表格UI状态 */
const { tableState, setTableSize, rowClassName, setSelectedRowKeys, clearSelection } =
  useTableUI();

/** 部门树数据 */
let deptTreeData = ref<Record<string, any>[]>([]);

/** 表格字段列 */
let tableColumns: ColumnsType = [
  { title: '用户编号', dataIndex: 'userId', align: 'left', width: 100 },
  { title: '登录账号', dataIndex: 'userName', align: 'left', width: 100 },
  { title: '用户昵称', dataIndex: 'nickName', align: 'left', width: 100 },
  { title: '手机号码', dataIndex: 'phone', align: 'left', width: 120 },
  { title: '部门名称', dataIndex: 'deptId', key: 'deptId', align: 'left', width: 100 },
  { title: '登录地址', dataIndex: 'loginIp', key: 'loginIp', align: 'left', width: 100 },
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
  { title: '用户状态', dataIndex: 'statusFlag', key: 'statusFlag', align: 'left', width: 100 },
  { title: '操作', key: 'userId', align: 'left' },
];

// ==================== 弹窗状态 ====================

let visibleByView = ref(false);
let visibleByEdit = ref(false);
let visibleByResetPwd = ref(false);
let modalTitle = ref('用户');
let confirmLoading = ref(false);

type OptionsType = { posts: Record<string, any>[]; roles: Record<string, any>[] };

/** 表单选项（岗位、角色列表） */
let formOptions = reactive<OptionsType>({ posts: [], roles: [] });

/** 表单数据 */
const form = reactive({
  userId: undefined as string | number | undefined,
  userName: '',
  password: '',
  deptId: '100',
  email: '',
  loginDate: 0,
  loginIp: '',
  nickName: '',
  phone: '',
  postIds: [] as (string | number)[],
  roleIds: [] as (string | number)[],
  sex: '0',
  statusFlag: '0',
  remark: '',
  createTime: 0,
  avatar: '',
  loginTime: 0,
});

/** 表单校验规则 */
const formCtl = Form.useForm(
  form,
  reactive({
    userName: [
      { required: true, pattern: regExpUserName, message: '账号只能包含大写小写字母，数字，且不少于4位' },
    ],
    password: [
      { required: true, pattern: regExpPassword, message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位' },
    ],
    nickName: [
      { required: true, pattern: regExpNick, message: '昵称只能包含字母、数字、中文和下划线，且不少于2位' },
    ],
    email: [
      { required: false, pattern: regExpEmail, message: '请输入正确的邮箱地址' },
    ],
    phone: [
      { required: false, pattern: regExpMobile, message: '请输入正确的手机号码' },
    ],
  }),
);

// ==================== 导入弹窗状态 ====================

let importState = reactive({
  open: false,
  title: '用户导入',
  loading: false,
  updateSupport: false,
  msg: '',
  templateDownload: false,
});

// ==================== 弹窗操作 ====================

/** 设置表单选项（角色、岗位列表） */
function setFormOptions(resData: any) {
  const roles = resData.roles.map((m: Record<string, any>) => {
    m.disabled = m.statusFlag === '0';
    return m;
  });
  const posts = resData.posts.map((m: Record<string, any>) => {
    m.disabled = m.statusFlag === '0';
    return m;
  });
  formOptions.roles = roles;
  formOptions.posts = posts;
  const { user, roleIds, postIds } = resData;
  Object.assign(form, user);
  form.roleIds = roleIds;
  form.postIds = postIds;
}

/** 打开详情弹窗 */
async function handleView(userId: string | number) {
  if (!userId || confirmLoading.value) return;
  confirmLoading.value = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const res = await getUser(userId);
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      setFormOptions(res.data);
      form.avatar = userStore.fnAvatar(form.avatar);
      modalTitle.value = '用户信息';
      visibleByView.value = true;
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

/** 打开新增/编辑弹窗 */
async function handleOpenEdit(userId?: string | number) {
  if (confirmLoading.value) return;
  confirmLoading.value = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const fetchId = userId || 0;
    const res = await getUser(fetchId);
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      if (!userId) formCtl.resetFields();
      setFormOptions(res.data);
      if (!userId && deptTreeData.value.length > 0) {
        form.deptId = deptTreeData.value[0].id;
      }
      modalTitle.value = userId ? '修改用户信息' : '添加用户信息';
      visibleByEdit.value = true;
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

/** 表单提交确认 */
async function handleSubmit() {
  const validateNames = ['nickName', 'email', 'phone'];
  if (!form.userId) {
    validateNames.push('userName', 'password');
  }
  try {
    await formCtl.validate(validateNames);
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  const hide = message.loading('请稍等...', 0);
  confirmLoading.value = true;
  try {
    const formRaw = toRaw(form);
    const res = formRaw.userId ? await updateUser(formRaw) : await addUser(formRaw);
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({ content: `${modalTitle.value}成功`, duration: 3 });
      fetchList(1);
      handleCloseModal();
    } else {
      message.error({ content: res.msg, duration: 3 });
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

/** 关闭所有弹窗 */
function handleCloseModal() {
  visibleByEdit.value = false;
  visibleByView.value = false;
  visibleByResetPwd.value = false;
  formCtl.resetFields();
  formOptions.roles = [];
  formOptions.posts = [];
}

// ==================== 重置密码 ====================

/** 打开重置密码弹窗 */
function handleOpenResetPwd(row: Record<string, string>) {
  formCtl.resetFields();
  form.userId = row.userId;
  form.userName = row.userName;
  modalTitle.value = '重置密码';
  visibleByResetPwd.value = true;
}

/** 重置密码提交 */
async function handleResetPwdSubmit() {
  try {
    await formCtl.validate(['userName', 'password']);
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  const hide = message.loading('请稍等...', 0);
  confirmLoading.value = true;
  try {
    const res = await resetPassword(form.userId!, form.password);
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({ content: `${modalTitle.value}成功`, duration: 3 });
      visibleByResetPwd.value = false;
      formCtl.resetFields();
    } else {
      message.error({ content: res.msg, duration: 3 });
    }
  } finally {
    hide();
    confirmLoading.value = false;
  }
}

// ==================== 列表操作 ====================

/** 用户状态修改 */
function handleStatusChange(row: Record<string, string>) {
  const text = row.statusFlag === '1' ? '启用' : '停用';
  Modal.confirm({
    title: '提示',
    content: `确定要${text} ${row.userName} 用户吗?`,
    onOk() {
      return withLoading(changeStatus(row.userId, row.statusFlag), {
        successText: `${row.userName} ${text}成功`,
      }).then(() => fetchList());
    },
    onCancel() {
      row.statusFlag = row.statusFlag === '1' ? '0' : '1';
    },
  });
}

/** 用户删除 */
function handleDelete(userId: string = '0') {
  if (userId === '0') {
    userId = tableState.selectedRowKeys.join(',');
  }
  confirmAndRun({
    content: `确认删除用户编号为 【${userId}】 的数据项?`,
    onOk: () => delUser(userId),
    successText: '删除成功',
    onSuccess: () => fetchList(),
  });
}

/** 用户解锁 */
function handleUnlock(userName: string) {
  confirmAndRun({
    content: `确认解锁用户 ${userName} ?`,
    onOk: () => unlock(userName),
    successText: `用户 ${userName} 解锁成功`,
  });
}

/** 列表导出 */
function handleExport() {
  confirmAndRun({
    content: '确认根据搜索条件导出xlsx表格文件吗?',
    onOk: () => exportUser(toRaw(queryParams)),
    successText: '已完成导出',
    onSuccess: (res) => { saveAs(res.data, `user_${Date.now()}.xlsx`); },
  });
}

// ==================== 导入操作 ====================

/** 打开导入弹窗 */
function handleOpenImport() {
  importState.updateSupport = false;
  importState.msg = '';
  importState.open = true;
}

/** 关闭导入弹窗 */
function handleCloseImport() {
  importState.open = false;
}

/** 上传并导入 */
async function handleImportUpload(file: File) {
  const hide = message.loading('正在上传并解析数据...', 0);
  importState.loading = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subPath', 'import');
    const uploadRes = await uploadFile(formData);
    if (uploadRes.code !== RESULT_CODE_SUCCESS) return;
    const filePath = uploadRes.data.filePath;
    const importRes = await importData(filePath, importState.updateSupport);
    if (importRes.code === RESULT_CODE_SUCCESS) {
      importState.msg = importRes.msg?.replaceAll(/<br\/>+/g, '\r');
    } else {
      message.error(importRes.msg, 3);
    }
  } finally {
    hide();
    importState.loading = false;
  }
}

/** 下载导入模板 */
async function handleDownloadTemplate() {
  if (importState.templateDownload) return;
  importState.templateDownload = true;
  try {
    const res = await importTemplate();
    if (res.code === RESULT_CODE_SUCCESS) {
      saveAs(res.data, `user_template_${Date.now()}.xlsx`);
    }
  } finally {
    importState.templateDownload = false;
  }
}

/** 查询用户列表 */
function fetchList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) queryParams.pageNum = pageNum;
  // 时间范围
  if (Array.isArray(queryRangePicker.value) && queryRangePicker.value.length > 0) {
    queryParams.beginTime = queryRangePicker.value[0].startOf('day').valueOf();
    queryParams.endTime = queryRangePicker.value[1].endOf('day').valueOf();
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
  listUser(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      clearSelection();
      const { total, rows } = res.data;
      setTotal(total);
      tableState.data = rows;
      // 删除后修正页码，避免空页面
      if (fixPageAfterDelete(rows.length)) {
        fetchList();
        return;
      }
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  loadDicts();
  // 获取部门树
  deptTree().then(res => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
      deptTreeData.value = res.data;
    }
  });
  fetchList();
});
</script>
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 所有系统用户管理列表 </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.seached" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              <a-input v-model:value="queryParams.userName" allow-clear :maxlength="30" placeholder="请输入登录账号"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phone">
              <a-input v-model:value="queryParams.phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="4" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择"
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
            <a-form-item label="部门名称" name="deptId">
              <a-tree-select v-model:value="queryParams.deptId" placeholder="部门名称" show-search tree-default-expand-all
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
                <a-button type="primary" @click.prevent="fetchList(1)">
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
      <!-- 插槽-卡片左侧侧 -->
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

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.seached" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList()">
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

      <!-- 表格列表 -->
      <a-table class="table" row-key="userId" :columns="tableColumns" :loading="tableState.loading"
        :data-source="tableState.data" :size="tableState.size" :row-class-name="rowClassName" :pagination="pagination"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: setSelectedRowKeys,
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deptId'">
            {{ record.dept?.deptName }}
          </template>
          <template v-if="column.key === 'statusFlag'">
            <a-switch v-if="
              dict.sysNormalDisable.length > 0 &&
              !record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)
            " v-perms:has="['system:user:edit']" v-model:checked="record.statusFlag" checked-value="1"
              :checked-children="dict.sysNormalDisable[0].label" un-checked-value="0"
              :un-checked-children="dict.sysNormalDisable[1].label" size="small" @change="handleStatusChange(record)" />
            <DictTag v-else :options="dict.sysNormalDisable" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'userId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.userId)" v-perms:has="['system:user:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleOpenEdit(record.userId)" v-perms:has="['system:user:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.userId)" v-perms:has="['system:user:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>重置密码</template>
                <a-button type="link" @click.prevent="handleOpenResetPwd(record)"
                  v-perms:has="['system:user:resetPwd']">
                  <template #icon>
                    <SecurityScanOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="!record.roleIds?.includes(SYS_ROLE_SYSTEM_ID)">
                <template #title>解锁</template>
                <a-button type="link" @click.prevent="handleUnlock(record.userName)"
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
    <ProModal :drag="true" :width="800" :open="visibleByView" :title="modalTitle" @cancel="handleCloseModal">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户编号" name="userId">
              {{ form.userId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+form.createTime > 0">
                {{ parseDateToStr(+form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录地址" name="loginIp">
              {{ form.loginIp }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录时间" name="loginTime">
              <span v-if="+form.loginTime > 0">
                {{ parseDateToStr(+form.loginTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户头像" name="avatar">
              <a-avatar shape="circle" size="default" :src="form.avatar" :alt="form.userName"></a-avatar>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName">
              {{ form.userName }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户昵称" name="nickName">
              {{ form.nickName }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="sex">
              <DictTag :options="dict.sysUserSex" :value="form.sex" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
              <DictTag :options="dict.sysNormalDisable" :value="form.statusFlag" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phone">
              {{ form.phone }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="电子邮箱" name="email">
              {{ form.email }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="归属部门" name="deptId" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select :value="form.deptId" placeholder="归属部门" disabled :tree-data="deptTreeData" :field-names="{
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
            <a-form-item label="用户岗位" name="postIds">
              <a-select :value="form.postIds" :disabled="true" mode="multiple" placeholder="请选择用户岗位"
                option-label-prop="postName" :options="formOptions.posts"
                :field-names="{ label: 'postName', value: 'postId' }">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24" v-if="!form.roleIds?.includes(SYS_ROLE_SYSTEM_ID)">
            <a-form-item label="用户角色" name="roleIds">
              <a-select :value="form.roleIds" disabled mode="multiple" placeholder="请选择用户角色"
                option-label-prop="roleName" :options="formOptions.roles"
                :field-names="{ label: 'roleName', value: 'roleId' }">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="用户说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCloseModal">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="visibleByEdit" :title="modalTitle" :confirm-loading="confirmLoading" @ok="handleSubmit"
      @cancel="handleCloseModal">
      <a-form name="formCtlByEdit" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row v-if="!form.userId">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录账号" name="userName" v-bind="formCtl.validateInfos.userName">
              <a-input v-model:value="form.userName" allow-clear :maxlength="30" placeholder="请输入登录账号">
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="登录密码" name="password" v-bind="formCtl.validateInfos.password">
              <a-input-password v-model:value="form.password" placeholder="登录密码" :maxlength="26">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户昵称" name="nickName" v-bind="formCtl.validateInfos.nickName">
              <a-input v-model:value="form.nickName" allow-clear :maxlength="30" placeholder="请输入用户昵称"></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户性别" name="sex">
              <a-select v-model:value="form.sex" default-value="1" placeholder="用户性别" :options="dict.sysUserSex">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户状态" name="statusFlag">
              <a-select v-model:value="form.statusFlag" default-value="0" placeholder="用户状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="手机号码" name="phone" v-bind="formCtl.validateInfos.phone">
              <a-input v-model:value="form.phone" allow-clear :maxlength="11" placeholder="请输入手机号码"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="电子邮箱" name="email" v-bind="formCtl.validateInfos.email">
              <a-input v-model:value="form.email" allow-clear :maxlength="40" placeholder="请输入电子邮箱"></a-input>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="归属部门" name="deptId" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select v-model:value="form.deptId" placeholder="归属部门" show-search tree-default-expand-all
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
            <a-form-item label="用户岗位" name="postIds">
              <a-select v-model:value="form.postIds" allow-clear mode="multiple" placeholder="请选择用户岗位" show-search
                option-filter-prop="postName" option-label-prop="postName" :options="formOptions.posts"
                :field-names="{ label: 'postName', value: 'postId' }">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="用户角色" name="roleIds">
              <a-select v-model:value="form.roleIds" allow-clear mode="multiple" placeholder="请选择用户角色" show-search
                option-filter-prop="roleName" option-label-prop="roleName" :options="formOptions.roles"
                :field-names="{ label: 'roleName', value: 'roleId' }">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="用户说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入用户说明" />
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 重置密码修改框 -->
    <ProModal :drag="true" :keyboard="false" :mask-closable="false" :open="visibleByResetPwd" :title="modalTitle"
      :confirm-loading="confirmLoading" @ok="handleResetPwdSubmit" @cancel="handleCloseModal">
      <a-form name="formCtlByResetPwd" layout="horizontal">
        <a-form-item label="登录账号" name="userName" v-bind="formCtl.validateInfos.userName">
          <a-input :value="form.userName" disabled :maxlength="30" placeholder="登录账号">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="登录密码" name="password" v-bind="formCtl.validateInfos.password">
          <a-input-password v-model:value="form.password" placeholder="登录密码" :maxlength="26">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
      </a-form>
    </ProModal>

    <!-- 上传导入表格数据文件框 -->
    <UploadModal :title="importState.title" :loading="importState.loading" @upload="handleImportUpload"
      @close="handleCloseImport" v-model:open="importState.open" :ext="['.xls', '.xlsx']" :size="10">
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
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
