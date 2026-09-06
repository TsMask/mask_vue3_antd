<script lang="ts" setup>
import { Modal, message } from 'ant-design-vue';
import type { CSSProperties } from 'vue';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import background from '@/assets/background.svg';
import {
  getPasswordResetCaptcha,
  lookupPasswordReset,
  resetPasswordByEmailOrPhone,
} from '@/api/auth';
import { regExpPassword, regExpUserName } from '@/utils/regular-utils';
import { useRouter } from 'vue-router';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import LoginHeader from '../login/components/LoginHeader.vue';
import LoginFooter from '../login/components/LoginFooter.vue';

const router = useRouter();

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundImage: `url(${background})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
};

const contentStyle: CSSProperties = {
  minHeight: '100%',
  padding: '48px 16px',
};

const currentStep = ref(0);
const state = reactive({
  form: {
    username: '',
    code: '',
    uuid: '',
    password: '',
    confirmPassword: '',
  },
  channel: '',
  maskedContact: '',
  captchaSent: false,
  lookupClick: false,
  captchaClick: false,
  resetClick: false,
});

let captchaInterval: ReturnType<typeof setInterval> | undefined;
const captchaState = reactive({
  click: false,
  time: 60,
});

const channelLabel = computed(() =>
  state.channel === 'email' ? '邮箱' : '手机号'
);

/** 校验两次输入的新密码是否一致 */
function fnConfirmPassword(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    callback('请再次输入新密码');
    return;
  }
  if (state.form.password !== value) {
    callback('两次输入的新密码不一致');
    return;
  }
  callback();
}

/** 表单验证通过后按当前步骤继续 */
function fnFinish() {
  if (currentStep.value === 0) {
    fnLookup();
    return;
  }
  if (currentStep.value === 1) {
    fnVerifyCaptcha();
    return;
  }
  fnResetPassword();
}

/** 查询账号绑定的找回联系方式 */
async function fnLookup() {
  state.lookupClick = true;
  try {
    const res = await lookupPasswordReset(state.form.username);
    if (res.code !== RESULT_CODE_SUCCESS || !res.data?.channel) {
      message.warning({
        content: res.msg || '账号未绑定邮箱或手机号，请联系系统管理员',
        duration: 3,
      });
      return;
    }
    state.channel = res.data.channel;
    state.maskedContact = res.data.masked_contact;
    state.form.code = '';
    state.form.uuid = '';
    state.captchaSent = false;
    stopCaptchaCountdown();
    captchaState.time = 60;
    captchaState.click = false;
    currentStep.value = 1;
  } catch (error: any) {
    message.error({
      content: error?.message || '查询找回联系方式失败',
      duration: 3,
    });
  } finally {
    state.lookupClick = false;
  }
}

/** 发送找回密码验证码 */
async function fnGetCaptcha() {
  if (captchaState.click || state.captchaClick) return;
  state.captchaClick = true;
  try {
    const res = await getPasswordResetCaptcha(state.form.username);
    if (res.code !== RESULT_CODE_SUCCESS || !res.data?.uuid) {
      message.warning({
        content: res.msg || '验证码发送失败',
        duration: 3,
      });
      return;
    }
    state.form.uuid = res.data.uuid;
    if (res.data?.text) {
      state.form.code = res.data.text;
    }
    captchaState.time = Number(res.data.resend_interval) || 60;
    captchaState.click = true;
    state.captchaSent = true;
    message.success({
      content: `验证码已发送至绑定${channelLabel.value}`,
      duration: 3,
    });
    captchaInterval = setInterval(() => {
      if (captchaState.time <= 0) {
        captchaState.time = 60;
        captchaState.click = false;
        stopCaptchaCountdown();
      } else {
        captchaState.time--;
      }
    }, 1000);
  } catch (error: any) {
    message.error({
      content: error?.message || '验证码发送失败',
      duration: 3,
    });
  } finally {
    state.captchaClick = false;
  }
}

/** 进入新密码步骤 */
function fnVerifyCaptcha() {
  currentStep.value = 2;
}

/** 提交新密码 */
async function fnResetPassword() {
  state.resetClick = true;
  try {
    const res = await resetPasswordByEmailOrPhone({
      username: state.form.username,
      code: state.form.code,
      uuid: state.form.uuid,
      password: state.form.password,
      confirm_password: state.form.confirmPassword,
    });
    if (res.code !== RESULT_CODE_SUCCESS) {
      message.warning({
        content: res.msg || '重置密码失败',
        duration: 3,
      });
      return;
    }
    Modal.success({
      title: '提示',
      content: '重置密码成功，请使用新密码登录',
      okText: '前往登录',
      onOk() {
        router.push({ name: 'Login' });
      },
    });
  } catch (error: any) {
    message.error({
      content: error?.message || '重置密码失败',
      duration: 3,
    });
  } finally {
    state.resetClick = false;
  }
}

function stopCaptchaCountdown() {
  if (captchaInterval) {
    clearInterval(captchaInterval);
    captchaInterval = undefined;
  }
}

function goLogin() {
  router.push({ name: 'Login' });
}

onBeforeUnmount(() => {
  captchaState.time = 60;
  captchaState.click = false;
  stopCaptchaCountdown();
});
</script>

<template>
  <a-layout :style="pageStyle">
    <a-layout-content :style="{ flex: 1 }">
      <a-flex
        vertical
        align="center"
        justify="center"
        :gap="40"
        :style="contentStyle"
      >
        <LoginHeader />

        <a-card :bordered="true" :style="{ width: '100%', maxWidth: '420px' }">
          <a-steps
            :current="currentStep"
            size="small"
            :items="[
              { title: '找回账号' },
              { title: '验证身份' },
              { title: '重置密码' },
            ]"
          />

          <a-form
            class="forgot-form"
            :model="state.form"
            name="ForgotPasswordForm"
            @finish="fnFinish"
          >
            <template v-if="currentStep === 0">
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
                  v-model:value="state.form.username"
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

            <template v-else-if="currentStep === 1">
              <a-alert
                :message="`将使用绑定${channelLabel}验证：${state.maskedContact}`"
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
                  v-model:value="state.form.code"
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
                      :disabled="captchaState.click || state.captchaClick"
                      @click="fnGetCaptcha"
                    >
                      {{
                        captchaState.click
                          ? `${captchaState.time} s`
                          : '获取验证码'
                      }}
                    </a-button>
                  </template>
                </a-input>
              </a-form-item>
            </template>

            <template v-else>
              <a-form-item
                name="password"
                :rules="[
                  {
                    required: true,
                    pattern: regExpPassword,
                    message:
                      '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
                  },
                ]"
              >
                <a-input-password
                  v-model:value="state.form.password"
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
                :rules="[{ required: true, validator: fnConfirmPassword }]"
              >
                <a-input-password
                  v-model:value="state.form.confirmPassword"
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

            <a-flex vertical :gap="12">
              <a-button
                block
                type="primary"
                size="large"
                html-type="submit"
                :loading="
                  state.lookupClick || state.captchaClick || state.resetClick
                "
              >
                {{ currentStep === 0 ? '下一步' : '继续' }}
              </a-button>
              <a-button
                block
                type="default"
                size="large"
                html-type="button"
                @click="currentStep > 0 ? (currentStep -= 1) : goLogin()"
              >
                {{ currentStep > 0 ? '上一步' : '返回登录' }}
              </a-button>
            </a-flex>
          </a-form>
        </a-card>
      </a-flex>
    </a-layout-content>

    <a-layout-footer
      :style="{ padding: '16px 24px', background: 'transparent' }"
    >
      <LoginFooter />
    </a-layout-footer>
  </a-layout>
</template>

<style lang="css" scoped>
.forgot-form {
  margin-top: 24px;
}
</style>
