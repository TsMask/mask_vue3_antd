<script setup lang="ts">
import { regExpMobile } from '@/utils/regular-utils';

const phone = defineModel<string>('phone', { required: true });
</script>

<template>
  <a-form-item
    name="phone"
    :rules="[
      {
        required: true,
        pattern: regExpMobile,
        message: '请输入正确的手机号码',
      },
    ]"
  >
    <a-input
      v-model:value="phone"
      size="large"
      placeholder="手机号码"
      :maxlength="11"
    >
      <template #prefix>
        <MobileOutlined />
      </template>
    </a-input>
  </a-form-item>
</template>
