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
import { isSuccess } from '@/plugins/http-fetch';
import { useRouter } from 'vue-router';
import LoginHeader from '../login/components/LoginHeader.vue';
import LoginFooter from '../login/components/LoginFooter.vue';
import AccountStepForm from './components/AccountStepForm.vue';
import CaptchaStepForm from './components/CaptchaStepForm.vue';
import ResetPasswordStepForm from './components/ResetPasswordStepForm.vue';

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

const stepItems = [
  { title: '找回账号' },
  { title: '验证身份' },
  { title: '重置密码' },
];

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
  lookupLoading: false,
  captchaSending: false,
  resetLoading: false,
});

let captchaInterval: ReturnType<typeof setInterval> | undefined;
const captchaState = reactive({
  counting: false,
  countdown: 60,
});

const channelLabel = computed(() =>
  state.channel === 'email' ? '邮箱' : '手机号'
);

/** 表单验证通过后按当前步骤继续 */
function handleFinish() {
  if (currentStep.value === 0) {
    handleLookup();
    return;
  }
  if (currentStep.value === 1) {
    handleVerifyCaptcha();
    return;
  }
  handleResetPassword();
}

/** 查询账号绑定的找回联系方式 */
async function handleLookup() {
  state.lookupLoading = true;
  try {
    const res = await lookupPasswordReset(state.form.username);
    if (!isSuccess(res) || !res.data?.channel) {
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
    resetCaptchaState();
    currentStep.value = 1;
  } catch (error: any) {
    message.error({
      content: error?.message || '查询找回联系方式失败',
      duration: 3,
    });
  } finally {
    state.lookupLoading = false;
  }
}

/** 发送找回密码验证码 */
async function handleSendCaptcha() {
  if (captchaState.counting || state.captchaSending) return;
  state.captchaSending = true;
  try {
    const res = await getPasswordResetCaptcha(state.form.username);
    if (!isSuccess(res) || !res.data?.uuid) {
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
    startCaptchaCountdown(Number(res.data.resend_interval) || 60);
    message.success({
      content: `验证码已发送至绑定${channelLabel.value}`,
      duration: 3,
    });
  } catch (error: any) {
    message.error({
      content: error?.message || '验证码发送失败',
      duration: 3,
    });
  } finally {
    state.captchaSending = false;
  }
}

/** 进入新密码步骤 */
function handleVerifyCaptcha() {
  currentStep.value = 2;
}

/** 提交新密码 */
async function handleResetPassword() {
  state.resetLoading = true;
  try {
    const res = await resetPasswordByEmailOrPhone({
      username: state.form.username,
      code: state.form.code,
      uuid: state.form.uuid,
      password: state.form.password,
      confirm_password: state.form.confirmPassword,
    });
    if (!isSuccess(res)) {
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
        handleBackLogin();
      },
    });
  } catch (error: any) {
    message.error({
      content: error?.message || '重置密码失败',
      duration: 3,
    });
  } finally {
    state.resetLoading = false;
  }
}

/** 账号重新查询后，旧验证码和倒计时都不能继续使用。 */
function resetCaptchaState() {
  stopCaptchaCountdown();
  captchaState.countdown = 60;
  captchaState.counting = false;
}

/** 使用后端返回的重发间隔启动倒计时，避免前端固定值与配置不一致 */
function startCaptchaCountdown(seconds: number) {
  captchaState.countdown = seconds;
  captchaState.counting = true;
  captchaInterval = setInterval(() => {
    if (captchaState.countdown <= 0) {
      resetCaptchaState();
      return;
    }
    captchaState.countdown--;
  }, 1000);
}

/** 仅停止计时器，保留当前显示值，供组件卸载时避免额外状态跳动 */
function stopCaptchaCountdown() {
  if (captchaInterval) {
    clearInterval(captchaInterval);
    captchaInterval = undefined;
  }
}

/** 回退当前步骤；已处于第一步时返回登录页 */
function handlePreviousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
    return;
  }
  handleBackLogin();
}

function handleBackLogin() {
  router.push({ name: 'Login' });
}

onBeforeUnmount(() => {
  resetCaptchaState();
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
          <a-steps :current="currentStep" size="small" :items="stepItems" />

          <a-form
            class="forgot-form"
            :model="state.form"
            name="ForgotPasswordForm"
            @finish="handleFinish"
          >
            <AccountStepForm
              v-if="currentStep === 0"
              v-model:username="state.form.username"
            />

            <CaptchaStepForm
              v-else-if="currentStep === 1"
              v-model:code="state.form.code"
              :channel-label="channelLabel"
              :masked-contact="state.maskedContact"
              :sending="state.captchaSending"
              :counting="captchaState.counting"
              :countdown="captchaState.countdown"
              @send="handleSendCaptcha"
            />

            <ResetPasswordStepForm
              v-else
              v-model:password="state.form.password"
              v-model:confirm-password="state.form.confirmPassword"
            />

            <a-flex vertical :gap="12">
              <a-button
                block
                type="primary"
                size="large"
                html-type="submit"
                :loading="
                  state.lookupLoading ||
                  state.captchaSending ||
                  state.resetLoading
                "
              >
                {{ currentStep === 0 ? '下一步' : '继续' }}
              </a-button>
              <a-button
                block
                type="default"
                size="large"
                html-type="button"
                @click="handlePreviousStep"
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
