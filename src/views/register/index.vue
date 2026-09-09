<script lang="ts" setup>
import { Modal, message } from 'ant-design-vue';
import type { CSSProperties } from 'vue';
import { reactive, watch, onMounted, onBeforeUnmount, ref } from 'vue';
import background from '@/assets/background.svg';
import {
  getCaptchaImage,
  register,
  registerByPhone,
  getCaptchaSMS,
} from '@/api/auth';
import { validMobile } from '@/utils/regular-utils';
import { isSuccess } from '@/plugins/http-fetch';
import { useRouter } from 'vue-router';
import RegisterHeader from './components/RegisterHeader.vue';
import RegisterAccountFields from './components/RegisterAccountFields.vue';
import RegisterPhoneField from './components/RegisterPhoneField.vue';
import RegisterCaptchaField from './components/RegisterCaptchaField.vue';
import RegisterFooter from './components/RegisterFooter.vue';

type RegisterTabKey = 'username' | 'phone';

const router = useRouter();
const codeImgFall =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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

const activeKey = ref<RegisterTabKey>('username');

const state = reactive({
  form: {
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    code: '',
    uuid: '',
  },
  submitting: false,
  captcha: {
    enabled: false,
    codeImg: '',
    codeImgFall,
  },
  captchaLoading: false,
});

let smsInterval: ReturnType<typeof setInterval> | undefined;
const smsState = reactive({
  counting: false,
  countdown: 60,
});

/** 表单验证通过后按注册通道提交 */
async function handleSubmit() {
  const hide = message.loading('请稍等...', 0);
  const isPhoneRegister = activeKey.value === 'phone';
  const registerAccount = isPhoneRegister
    ? state.form.phone
    : state.form.username;
  const registerForm = isPhoneRegister
    ? {
        phone: state.form.phone,
        code: state.form.code,
        uuid: state.form.uuid,
      }
    : {
        username: state.form.username,
        password: state.form.password,
        confirm_password: state.form.confirmPassword,
        code: state.form.code,
        uuid: state.form.uuid,
      };
  const registerRequest = isPhoneRegister
    ? registerByPhone(registerForm)
    : register(registerForm);

  state.submitting = true;
  try {
    const res = await registerRequest;
    if (!isSuccess(res)) {
      message.error({
        content: res.msg || '注册失败',
        duration: 3,
      });
      return;
    }

    Modal.success({
      title: '提示',
      content: `恭喜您，${registerAccount} 账号注册成功！`,
      okText: '前往登录',
      onOk() {
        handleBackLogin();
      },
    });
  } catch (error: any) {
    message.error({
      content: error?.message || '注册失败，请稍后重试',
      duration: 3,
    });
  } finally {
    hide();
    state.submitting = false;
    state.form.code = '';
    if (!isPhoneRegister && state.captcha.enabled) {
      handleGetCaptcha();
    }
  }
}

/** 获取账号注册图形验证码 */
async function handleGetCaptcha() {
  if (state.captchaLoading) return;
  state.captchaLoading = true;
  try {
    const res = await getCaptchaImage();
    if (!isSuccess(res) || !res.data) {
      message.warning({
        content: res.msg || '获取验证码失败',
        duration: 3,
      });
      return;
    }

    const { enabled, img, uuid } = res.data;
    state.captcha.enabled = Boolean(enabled);
    if (state.captcha.enabled) {
      state.captcha.codeImg = img;
      state.form.uuid = uuid;
    } else {
      state.captcha.codeImg = '';
      state.form.uuid = '';
    }
    if (res.data?.text) {
      state.form.code = res.data.text;
    }
  } catch (error: any) {
    message.error({
      content: error?.message || '获取验证码失败，请稍后重试',
      duration: 3,
    });
  } finally {
    state.captchaLoading = false;
  }
}

/** 获取手机号注册短信验证码 */
async function handleSendSmsCaptcha() {
  if (smsState.counting || activeKey.value !== 'phone') return;
  if (!validMobile(state.form.phone)) {
    message.warning({
      content: '请确认手机号码是否有效！',
      duration: 3,
    });
    return;
  }

  try {
    const res = await getCaptchaSMS(state.form.phone);
    if (activeKey.value !== 'phone') return;
    if (!isSuccess(res) || !res.data?.uuid) {
      message.warning({
        content: res.msg || '短信验证码发送失败',
        duration: 3,
      });
      return;
    }

    state.form.uuid = res.data.uuid;
    if (res.data?.text) {
      state.form.code = res.data.text;
    }
    startSmsCountdown(Number(res.data.resend_interval) || 60);
    message.success({
      content: '发送成功，请注意查看短信！',
      duration: 3,
    });
  } catch (error: any) {
    message.error({
      content: error?.message || '短信验证码发送失败',
      duration: 3,
    });
  }
}

/** 使用后端返回的重发间隔启动倒计时，避免前端固定值与配置不一致 */
function startSmsCountdown(seconds: number) {
  smsState.countdown = seconds;
  smsState.counting = true;
  smsInterval = setInterval(() => {
    if (smsState.countdown <= 0) {
      resetSmsState();
      return;
    }
    smsState.countdown--;
  }, 1000);
}

/** 复位短信状态并清理定时器，通道切换和组件卸载共用 */
function resetSmsState() {
  stopSmsCountdown();
  smsState.countdown = 60;
  smsState.counting = false;
}

/** 仅停止计时器，保留当前显示值，供组件卸载时避免额外状态跳动 */
function stopSmsCountdown() {
  if (smsInterval) {
    clearInterval(smsInterval);
    smsInterval = undefined;
  }
}

/** 切换注册通道后，两种验证码的编码不能混用。 */
function handleTabChange() {
  state.form.code = '';
  state.form.uuid = '';
  if (activeKey.value === 'username' && state.captcha.enabled) {
    handleGetCaptcha();
  }
}

function handleBackLogin() {
  router.push({ name: 'Login' });
}

watch(activeKey, handleTabChange);

onMounted(() => {
  handleGetCaptcha();
});

onBeforeUnmount(() => {
  resetSmsState();
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
        <RegisterHeader />

        <a-card :bordered="true" :style="{ width: '100%', maxWidth: '400px' }">
          <a-form
            :model="state.form"
            name="RegisterForm"
            @finish="handleSubmit"
          >
            <a-tabs
              v-model:activeKey="activeKey"
              tab-position="top"
              type="line"
              :centered="true"
              :destroy-inactive-tab-pane="true"
            >
              <a-tab-pane key="username" tab="账号注册">
                <RegisterAccountFields
                  v-model:username="state.form.username"
                  v-model:password="state.form.password"
                  v-model:confirm-password="state.form.confirmPassword"
                />
              </a-tab-pane>

              <a-tab-pane key="phone" tab="手机号注册">
                <RegisterPhoneField v-model:phone="state.form.phone" />
              </a-tab-pane>
            </a-tabs>

            <RegisterCaptchaField
              v-model:code="state.form.code"
              :phone-mode="activeKey === 'phone'"
              :sms-counting="smsState.counting"
              :sms-countdown="smsState.countdown"
              :captcha="state.captcha"
              @refresh-captcha="handleGetCaptcha"
              @send-captcha="handleSendSmsCaptcha"
            />

            <a-flex vertical :gap="12">
              <a-button
                block
                type="primary"
                size="large"
                html-type="submit"
                :loading="state.submitting"
              >
                注册
              </a-button>
              <a-button
                block
                type="default"
                size="large"
                html-type="button"
                @click="handleBackLogin"
              >
                使用已有账号登录
              </a-button>
            </a-flex>
          </a-form>
        </a-card>
      </a-flex>
    </a-layout-content>

    <a-layout-footer
      :style="{ padding: '16px 24px', background: 'transparent' }"
    >
      <RegisterFooter />
    </a-layout-footer>
  </a-layout>
</template>
