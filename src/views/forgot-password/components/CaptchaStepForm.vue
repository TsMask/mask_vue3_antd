<script setup lang="ts">
defineProps<{
  channelLabel: string;
  maskedContact: string;
  sending: boolean;
  counting: boolean;
  countdown: number;
}>();

const emit = defineEmits<{ send: [] }>();

const code = defineModel<string>('code', { required: true });
</script>

<template>
  <a-alert
    :message="`将使用绑定${channelLabel}验证：${maskedContact}`"
    type="info"
    show-icon
    :style="{ marginBottom: '20px' }"
  />
  <a-form-item
    name="code"
    :rules="[
      {
        required: true,
        min: 6,
        message: '请输入6位验证码',
      },
    ]"
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
          :disabled="counting || sending"
          @click="emit('send')"
        >
          {{ counting ? `${countdown} s` : '获取验证码' }}
        </a-button>
      </template>
    </a-input>
  </a-form-item>
</template>
