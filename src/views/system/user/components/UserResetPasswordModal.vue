<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message, useForm, type FormInstance } from 'antdv-next';
import { resetPassword } from '@/api/system/user';
import { regExpPassword } from '@/utils/regular';
import { useModalAction } from '@/hooks/useModalAction';

const visible = ref(false);
const form = reactive({
  user_id: undefined as string | number | undefined,
  user_name: '',
  password: '',
});
const rules = reactive({
  password: [
    {
      required: true,
      pattern: regExpPassword,
      message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
    },
  ],
});
const formInstance = useForm('formCtlByUserResetPassword');

// Compatibility layer for the legacy Form.useForm controller; a-form-item
// now owns validation feedback, so validateInfos binds empty objects.
const formCtl = {
  validate: (...args: Parameters<FormInstance['validate']>) =>
    formInstance.validate(...args),
  resetFields: (...args: Parameters<FormInstance['resetFields']>) =>
    formInstance.resetFields(...args),
  clearValidate: (...args: Parameters<FormInstance['clearValidate']>) =>
    formInstance.clearValidate(...args),
  validateInfos: new Proxy({} as Record<string, any>, {
    get: () => ({}),
  }),
};
const { executeAction, loading: submitting } = useModalAction();

/** 打开弹窗时锁定目标用户，只重置该用户密码 */
async function open(row: Record<string, any>) {
  form.user_id = row.id;
  form.user_name = row.user_name;
  visible.value = true;
  await nextTick();
  formCtl.clearValidate();
}

function handleClose() {
  if (visible.value) formCtl.clearValidate();
  visible.value = false;
  form.user_id = undefined;
  form.user_name = '';
  form.password = '';
}

/** 管理员重置密码不需要旧密码，成功后关闭弹窗 */
async function handleSubmit() {
  try {
    await formCtl.validate();
  } catch (error: any) {
    message.error({
      content: `请正确填写 ${error.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }

  await executeAction({
    action: () => resetPassword(form.user_id!, form.password),
    successText: '重置密码成功',
    onSuccess: handleClose,
  });
}

defineExpose({ open });
</script>

<template>
  <ProModal
    :drag="true"
    :keyboard="false"
    :mask-closable="false"
    :open="visible"
    title="重置密码"
    :confirm-loading="submitting"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form
      name="formCtlByUserResetPassword"
      :model="form"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
    >
      <a-form-item label="登录账号" name="user_name">
        <a-input
          :value="form.user_name"
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
        v-bind="formCtl.validateInfos.password"
      >
        <a-input-password
          v-model:value="form.password"
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
</template>
