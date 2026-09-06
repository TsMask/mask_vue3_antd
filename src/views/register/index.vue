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
import { useRouter } from 'vue-router';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import Header from './components/Header.vue';
import AccountFields from './components/AccountFields.vue';
import PhoneField from './components/PhoneField.vue';
import CaptchaField from './components/CaptchaField.vue';
import Footer from './components/Footer.vue';

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

/** 注册通道默认激活账号密码注册 */
const activeKey = ref<'username' | 'phone'>('username');

const state = reactive({
  /** 表单属性 */
  form: {
    /** 账号 */
    username: '',
    /** 手机号 */
    phone: '',
    /** 密码 */
    password: '',
    /** 确认密码 */
    confirmPassword: '',
    /** 验证码 */
    code: '',
    /** 验证码uuid */
    uuid: '',
  },
  /** 表单提交点击状态 */
  formClick: false,
  /** 验证码状态 */
  captcha: {
    /** 验证码开关 */
    enabled: false,
    /** 验证码图片地址 */
    codeImg: '',
    codeImgFall,
  },
  /** 验证码点击状态 */
  captchaClick: false,
});

/** 手机号注册验证码状态 */
let smsInterval: ReturnType<typeof setInterval> | undefined;
const smsState = reactive({
  click: false,
  time: 60,
});

/** 表单验证通过 */
function fnFinish() {
  const hide = message.loading('请稍等...', 0);
  state.formClick = true;
  const isPhoneRegister = activeKey.value === 'phone';
  const registerAccount = isPhoneRegister
    ? state.form.phone
    : state.form.username;
  const form = isPhoneRegister
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
    ? registerByPhone(form)
    : register(form);

  registerRequest
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        Modal.success({
          title: '提示',
          content: `恭喜您，${registerAccount} 账号注册成功！`,
          okText: '前往登录',
          onOk() {
            router.push({ name: 'Login' });
          },
        });
      } else {
        message.error({
          content: `${res.msg}`,
          duration: 3,
        });
      }
    })
    .finally(() => {
      hide();
      state.formClick = false;
      state.form.code = '';
      if (!isPhoneRegister && state.captcha.enabled) {
        fnGetCaptcha();
      }
    });
}

/** 获取手机号注册验证码 */
async function fnGetSmsCaptcha() {
  if (smsState.click || activeKey.value !== 'phone') return;
  if (!validMobile(state.form.phone)) {
    message.warning({
      content: '请确认手机号码是否有效！',
      duration: 3,
    });
    return;
  }
  try {
    const res = await getCaptchaSMS(state.form.phone);
    if (res.code !== RESULT_CODE_SUCCESS || !res.data?.uuid) {
      message.warning({
        content: `${res.msg}`,
        duration: 3,
      });
      return;
    }

    state.form.uuid = res.data.uuid;
    if (res.data?.text) {
      state.form.code = res.data.text;
    }
    smsState.time = Number(res.data.resend_interval) || 60;
    smsState.click = true;
    message.success({
      content: '发送成功，请注意查看短信！',
      duration: 3,
    });
    smsInterval = setInterval(() => {
      if (smsState.time <= 0) {
        smsState.time = 60;
        smsState.click = false;
        stopSmsCountdown();
      } else {
        smsState.time--;
      }
    }, 1000);
  } catch (error: any) {
    message.error({
      content: error?.message || '短信验证码发送失败',
      duration: 3,
    });
  }
}

/** 停止手机号注册验证码倒计时 */
function stopSmsCountdown() {
  if (smsInterval) {
    clearInterval(smsInterval);
    smsInterval = undefined;
  }
}

watch(activeKey, () => {
  state.form.code = '';
  state.form.uuid = '';
  if (activeKey.value === 'username' && state.captcha.enabled) {
    fnGetCaptcha();
  }
});

/** 获取验证码 */
function fnGetCaptcha() {
  if (state.captchaClick) return;
  state.captchaClick = true;
  getCaptchaImage()
    .then(res => {
      if (res.code !== RESULT_CODE_SUCCESS) {
        return;
      }
      const { enabled, img, uuid } = res.data;
      state.captcha.enabled = Boolean(enabled);
      if (state.captcha.enabled) {
        state.captcha.codeImg = img;
        state.form.uuid = uuid;
      }
      if (res.data?.text) {
        state.form.code = res.data.text;
      }
    })
    .finally(() => {
      state.captchaClick = false;
    });
}

function goLogin() {
  router.push({ name: 'Login' });
}

onMounted(() => {
  fnGetCaptcha();
});

onBeforeUnmount(() => {
  smsState.time = 60;
  smsState.click = false;
  stopSmsCountdown();
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
        <Header />

        <a-card :bordered="true" :style="{ width: '100%', maxWidth: '400px' }">
          <a-form :model="state.form" name="stateForm" @finish="fnFinish">
            <a-tabs
              v-model:activeKey="activeKey"
              tab-position="top"
              type="line"
              :centered="true"
              :destroy-inactive-tab-pane="true"
            >
              <a-tab-pane key="username" tab="账号注册">
                <AccountFields
                  v-model:username="state.form.username"
                  v-model:password="state.form.password"
                  v-model:confirm-password="state.form.confirmPassword"
                />
              </a-tab-pane>

              <a-tab-pane key="phone" tab="手机号注册">
                <PhoneField v-model:phone="state.form.phone" />
              </a-tab-pane>
            </a-tabs>

            <CaptchaField
              v-model:code="state.form.code"
              :is-phone="activeKey === 'phone'"
              :sms-click="smsState.click"
              :sms-time="smsState.time"
              :captcha="state.captcha"
              @refresh="fnGetCaptcha"
              @send="fnGetSmsCaptcha"
            />

            <a-flex vertical :gap="12">
              <a-button
                block
                type="primary"
                size="large"
                html-type="submit"
                :loading="state.formClick"
              >
                注册
              </a-button>
              <a-button block type="default" size="large" @click="goLogin">
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
      <Footer />
    </a-layout-footer>
  </a-layout>
</template>
