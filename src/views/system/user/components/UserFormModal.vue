<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import { getUser, updateUser, addUser } from '@/api/system/user';
import {
  regExpPassword,
  regExpMobile,
  regExpNick,
  regExpEmail,
  regExpUserName,
} from '@/utils/regular';
import { parseDateToStr } from '@/utils/date';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';
import useUserStore from '@/store/modules/user';

const props = defineProps<{
  deptTreeData: Record<string, any>[];
}>();
const emit = defineEmits<{ success: [] }>();
const userStore = useUserStore();

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysUserGender: 'sys_user_gender',
  },
});

/** getUser 会同时返回角色/岗位选项，随详情加载可保证选项与当前环境一致。 */
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

/** 接口返回 user 主体和授权字段，表单需要二者合并后的扁平结构。 */
function transformUserDetail(resData: any) {
  const { user, role_ids, post_ids } = resData;
  return { ...user, role_ids, post_ids };
}

const { modal, formCtl, isView, openModal, closeModal } = useModalForm({
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

const formOptions = reactive<{
  posts: Record<string, any>[];
  roles: Record<string, any>[];
}>({
  posts: [],
  roles: [],
});

function openView(user_id: string | number) {
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

/** 新增也通过详情接口获取可用角色/岗位，并默认选中第一个部门 */
function openEdit(user_id?: string | number) {
  const defaultDept = props.deptTreeData[0];
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

const { executeAction, loading: submitting } = useModalAction();

/** 账号和密码仅新增必填，编辑时避免旧密码为空导致校验失败 */
async function handleSubmit() {
  const validateNames = ['user_nick', 'user_email', 'user_phone'];
  if (!modal.form.id) {
    validateNames.push('user_name', 'password');
  }
  try {
    await formCtl.validate(validateNames);
  } catch (error: any) {
    message.error({
      content: `请正确填写 ${error.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }

  const form = toRaw(modal.form);
  await executeAction({
    action: () => (form.id ? updateUser(form) : addUser(form)),
    successText: '操作成功',
    onSuccess: () => {
      handleClose();
      emit('success');
    },
  });
}

/** 关闭时清理角色/岗位选项，避免下次弹窗短暂显示旧选项 */
function handleClose() {
  closeModal();
  formOptions.roles = [];
  formOptions.posts = [];
}

defineExpose({ openView, openEdit });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnClose="true"
    :width="800"
    :keyboard="!isView"
    :mask-closable="isView"
    :open="modal.visible"
    :title="modal.title"
    :confirm-loading="submitting"
    :footer="isView ? null : undefined"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form
      name="formCtlByUserEdit"
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
            />
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
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="用户状态" name="user_status">
            <a-select
              v-model:value="modal.form.user_status"
              default-value="0"
              placeholder="用户状态"
              :options="dict.sysNormalDisable"
            />
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
            />
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
            />
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
        />
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
            />
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
            />
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
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="登录账号" name="user_name">
            {{ modal.form.user_name }}
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </ProModal>
</template>
