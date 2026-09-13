<script setup lang="ts">
import {
  regExpPassword,
  regExpUserName,
  validMobile,
} from '@/utils/regular';

const username = defineModel<string>('username', { required: true });
const password = defineModel<string>('password', { required: true });
const confirmPassword = defineModel<string>('confirmPassword', {
  required: true,
});

/** 普通注册只允许用户名，手机号走独立注册通道 */
function validateUsername(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    callback('请输入登录账号');
  } else if (!regExpUserName.test(value)) {
    callback('账号仅支持字母数字，且不少于4位');
  } else if (validMobile(value)) {
    callback('手机号请切换到手机号注册');
  } else {
    callback();
  }
}

/** 表单验证确认密码是否一致 */
function validateConfirmPassword(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    callback('请正确输入确认密码');
    return;
  }
  if (password.value === value) {
    callback();
    return;
  }
  callback('两次输入的密码不一致');
}
</script>

<template>
  <a-form-item
    name="username"
    :rules="[
      {
        required: true,
        validator: validateUsername,
      },
    ]"
  >
    <a-input
      v-model:value="username"
      size="large"
      placeholder="登录账号"
      :maxlength="30"
    >
      <template #prefix>
        <UserOutlined />
      </template>
    </a-input>
  </a-form-item>
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
      placeholder="登录密码"
      :maxlength="26"
    >
      <template #prefix>
        <LockOutlined />
      </template>
    </a-input-password>
  </a-form-item>
  <a-form-item
    name="confirmPassword"
    :rules="[
      {
        required: true,
        min: 6,
        max: 26,
        validator: validateConfirmPassword,
      },
    ]"
  >
    <a-input-password
      v-model:value="confirmPassword"
      size="large"
      placeholder="确认登录密码"
      :maxlength="26"
    >
      <template #prefix>
        <LockOutlined />
      </template>
    </a-input-password>
  </a-form-item>
</template>
