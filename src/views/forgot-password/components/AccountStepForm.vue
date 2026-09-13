<script setup lang="ts">
import { regExpUserName } from '@/utils/regular';

const username = defineModel<string>('username', { required: true });
</script>

<template>
  <a-form-item
    name="username"
    :rules="[
      {
        required: true,
        pattern: regExpUserName,
        message: '请输入正确的用户账号',
      },
    ]"
  >
    <a-input
      v-model:value="username"
      size="large"
      placeholder="用户账号"
      :maxlength="30"
    >
      <template #prefix>
        <UserOutlined />
      </template>
    </a-input>
  </a-form-item>
</template>
