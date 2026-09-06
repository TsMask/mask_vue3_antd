<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{
  captcha: {
    enabled: boolean;
    codeImg: string;
    codeImgFall: string;
  };
}>();

const emit = defineEmits<{ refreshCaptcha: [] }>();
const username = defineModel<string>('username', { required: true });
const password = defineModel<string>('password', { required: true });
const code = defineModel<string>('code', { required: true });
const router = useRouter();

function goRegister() {
  router.push({ name: 'Register' });
}

function goForgotPassword() {
  router.push({ name: 'ForgotPassword' });
}
</script>

<template>
  <a-form-item
    name="username"
    :rules="[
      {
        required: true,
        min: 2,
        max: 30,
        message: '请输入正确登录账号',
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
        min: 6,
        max: 26,
        message: '请输入正确登录密码',
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
    v-if="captcha.enabled"
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
        @click="emit('refreshCaptcha')"
      />
    </a-input-group>
  </a-form-item>

  <a-form-item>
    <a-flex justify="space-between" align="center">
      <a-button
        size="small"
        type="link"
        target="_self"
        title="注册账号"
        @click="goRegister"
      >
        注册账号
      </a-button>
      <a-button
        size="small"
        type="link"
        title="忘记密码"
        @click="goForgotPassword"
      >
        忘记密码
      </a-button>
    </a-flex>
  </a-form-item>
</template>
