<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { Modal, message } from 'ant-design-vue';
import { updateUserPassword } from '@/api/profile';
import { logoutAuthSession } from '@/plugins/authSession';
import { isSuccess } from '@/plugins/httpFetch';
import useUserStore from '@/store/modules/user';
import { regExpPassword } from '@/utils/regular';
const userStore = useUserStore();
const submitting = ref(false);

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

/** 校验确认密码：必填、不能沿用旧密码，且必须与新密码一致 */
function validateConfirmPassword(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    callback('请输入确认新密码');
    return;
  }
  if (form.old_password === value) {
    callback('与旧密码一致，请重新输入新密码');
    return;
  }
  if (form.new_password !== value) {
    callback('两次输入的新密码不一致');
    return;
  }
  callback();
}

function handleSubmit() {
  Modal.confirm({
    title: '提示',
    content: '确认要提交修改密码吗？',
    onOk: () =>
      submitPassword().catch(error => {
        message.error({
          content: error?.message || '修改密码失败，请稍后重试',
          duration: 3,
        });
      }),
  });
}

/** 修改密码成功后必须重新登录，让后端重新建立认证态 */
async function submitPassword() {
  const hide = message.loading('请稍等...', 0);
  submitting.value = true;
  try {
    const res = await updateUserPassword(
      form.old_password,
      form.confirm_password
    );
    if (!isSuccess(res)) {
      message.error({
        content: res.msg || '修改密码失败',
        duration: 3,
      });
      return;
    }

    Modal.success({
      title: '提示',
      content: `恭喜您，${userStore.user_name} 账号密码修改成功！`,
      okText: '重新登录',
      onOk: handleRelogin,
    });
  } finally {
    hide();
    submitting.value = false;
  }
}

/** 退出并清理本地登录态，避免旧 token 继续请求新密码账号 */
async function handleRelogin() {
  await logoutAuthSession();
}
</script>

<template>
  <a-form
    :model="form"
    name="AccountResetPasswordForm"
    :wrapper-col="{ lg: 6, md: 8, xs: 14 }"
    :label-col="{ lg: 4, md: 4, xs: 6 }"
    :label-wrap="true"
    @finish="handleSubmit"
  >
    <a-form-item
      label="旧密码"
      name="old_password"
      :rules="[
        {
          required: true,
          min: 6,
          max: 26,
          message: '旧密码不能为空，且不少于6位',
        },
      ]"
    >
      <a-input-password
        v-model:value="form.old_password"
        placeholder="请输入旧密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item
      label="新密码"
      name="new_password"
      :rules="[
        {
          required: true,
          pattern: regExpPassword,
          message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
        },
      ]"
    >
      <a-input-password
        v-model:value="form.new_password"
        placeholder="请输入新密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item
      label="确认新密码"
      name="confirm_password"
      :rules="[{ required: true, validator: validateConfirmPassword }]"
    >
      <a-input-password
        v-model:value="form.confirm_password"
        placeholder="请确认新密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item :wrapper-col="{ offset: 4 }">
      <a-button type="primary" html-type="submit" :loading="submitting">
        提交修改
      </a-button>
    </a-form-item>
  </a-form>
</template>
