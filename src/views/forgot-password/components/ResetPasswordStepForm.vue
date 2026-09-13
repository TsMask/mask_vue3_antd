<script setup lang="ts">
import { regExpPassword } from '@/utils/regular';

const password = defineModel<string>('password', { required: true });
const confirmPassword = defineModel<string>('confirmPassword', {
  required: true,
});

/** 找回密码只允许提交两次一致的新密码 */
function validateConfirmPassword(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    callback('请再次输入新密码');
    return;
  }
  if (password.value !== value) {
    callback('两次输入的新密码不一致');
    return;
  }
  callback();
}
</script>

<template>
  <a-form-item
    name="password"
    :rules="[
      {
        required: true,
        pattern: regExpPassword,
        message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
      },
    ]"
  >
    <a-input-password
      v-model:value="password"
      size="large"
      placeholder="新登录密码"
      :maxlength="26"
    >
      <template #prefix>
        <LockOutlined />
      </template>
    </a-input-password>
  </a-form-item>
  <a-form-item
    name="confirmPassword"
    :rules="[{ required: true, validator: validateConfirmPassword }]"
  >
    <a-input-password
      v-model:value="confirmPassword"
      size="large"
      placeholder="确认新密码"
      :maxlength="26"
    >
      <template #prefix>
        <LockOutlined />
      </template>
    </a-input-password>
  </a-form-item>
</template>
