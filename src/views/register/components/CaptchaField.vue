<script setup lang="ts">
defineProps<{
  isPhone: boolean;
  smsClick: boolean;
  smsTime: number;
  captcha: {
    enabled: boolean;
    codeImg: string;
    codeImgFall: string;
  };
}>();

const emit = defineEmits<{ refresh: []; send: [] }>();
const code = defineModel<string>('code', { required: true });
</script>

<template>
  <a-form-item
    v-if="isPhone"
    name="code"
    :rules="[{ required: true, min: 6, message: '请输入正确的短信验证码' }]"
  >
    <a-input
      v-model:value="code"
      size="large"
      placeholder="短信验证码"
      :maxlength="6"
    >
      <template #prefix>
        <RobotOutlined />
      </template>
      <template #suffix>
        <a-button
          size="small"
          type="link"
          :disabled="smsClick"
          @click="emit('send')"
        >
          {{ smsClick ? `${smsTime} s` : '获取验证码' }}
        </a-button>
      </template>
    </a-input>
  </a-form-item>
  <a-form-item
    v-else-if="captcha.enabled"
    name="code"
    :rules="[{ required: true, min: 1, message: '请输入正确验证码' }]"
  >
    <a-input-group compact>
      <a-input
        v-model:value="code"
        size="large"
        placeholder="验证码"
        :maxlength="6"
        style="width: calc(100% - 120px)"
      >
        <template #prefix>
          <RobotOutlined />
        </template>
      </a-input>
      <a-image
        alt="验证码"
        style="cursor: pointer; border-radius: inherit"
        width="120px"
        height="40px"
        :preview="false"
        :src="captcha.codeImg"
        :fallback="captcha.codeImgFall"
        @click="emit('refresh')"
      />
    </a-input-group>
  </a-form-item>
</template>
