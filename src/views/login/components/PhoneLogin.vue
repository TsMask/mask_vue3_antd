<script setup lang="ts">
import { regExpMobile } from '@/utils/regular';

defineProps<{
  counting: boolean;
  countdown: number;
}>();

const emit = defineEmits<{ send: [] }>();
const phone = defineModel<string>('phone', { required: true });
const code = defineModel<string>('code', { required: true });
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
  <a-form-item
    name="code"
    :rules="[{ required: true, min: 6, message: '请输入正确的短信验证码' }]"
  >
    <a-input
      v-model:value="code"
      size="large"
      placeholder="验证码"
      :maxlength="6"
    >
      <template #prefix>
        <RobotOutlined />
      </template>
      <template #suffix>
        <a-button
          size="small"
          type="link"
          html-type="button"
          :disabled="counting"
          @click="emit('send')"
        >
          {{ counting ? `${countdown} s` : '获取验证码' }}
        </a-button>
      </template>
    </a-input>
  </a-form-item>
</template>
