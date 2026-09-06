<script lang="ts" setup>
import { message } from 'ant-design-vue';
import type { CSSProperties } from 'vue';
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import background from '@/assets/background.svg';
import useUserStore from '@/store/modules/user';
import { getCaptchaImage, getCaptchaSMS } from '@/api/auth';
import { validMobile } from '@/utils/regular-utils';
import { useRouter, useRoute } from 'vue-router';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import LoginHeader from './components/LoginHeader.vue';
import LoginFooter from './components/LoginFooter.vue';
import UsernameLogin from './components/UsernameLogin.vue';
import PhoneLogin from './components/PhoneLogin.vue';
import OtherLogin from './components/OtherLogin.vue';

const router = useRouter();
const route = useRoute();
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

/** Tab默认激活 */
const activeKey = ref<'username' | 'phone'>('username');

const state = reactive({
  /** 表单属性 */
  form: {
    /** 账号 */
    username: '',
    /** 密码 */
    password: '',
    /** 手机号 */
    phone: '',
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

/** 表单验证通过 */
function fnFinish() {
  state.formClick = true;
  let form = {};
  // 账号密码登录
  if (activeKey.value === 'username') {
    form = {
      username: state.form.username,
      password: state.form.password,
      code: state.form.code,
      uuid: state.form.uuid,
    };
  }
  // 手机号登录
  if (activeKey.value === 'phone') {
    form = {
      phone: state.form.phone,
      code: state.form.code,
      uuid: state.form.uuid,
    };
  }
  // 发送请求
  useUserStore()
    .fnLogin(form)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        message.success({
          content: '登录成功',
          duration: 3,
        });
        /** 登录后重定向页面 */
        const redirectPath = (route.query && route.query.redirect) || '/index';
        router.push({ path: redirectPath as string });
      } else {
        message.error({
          content: `${res.msg}`,
          duration: 3,
        });
      }
    })
    .finally(() => {
      state.formClick = false;
      state.form.code = '';
      if (activeKey.value === 'username' && state.captcha.enabled) {
        fnGetCaptcha();
      }
    });
}

/** 获取验证码 */
function fnGetCaptcha() {
  if (state.captchaClick) return;
  state.captchaClick = true;
  getCaptchaImage()
    .then(res => {
      if (res.code !== RESULT_CODE_SUCCESS) {
        message.warning({
          content: `${res.msg}`,
          duration: 3,
        });
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

/** 短信验证码定时器 */
let smsInterval: ReturnType<typeof setInterval> | undefined;

/** 短信验证码信息状态 */
const smsState = reactive({
  /** 点击状态 */
  click: false,
  /** 发送倒计时 */
  time: 60,
});

/** 获取短信验证码 */
async function fnGetSmsCaptcha() {
  if (smsState.click) return;
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
    if (activeKey.value !== 'phone') return;

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

/** 停止短信验证码倒计时 */
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

onMounted(() => {
  fnGetCaptcha();
  // 开发环境自动填充账号密码登录信息
  if (import.meta.env.DEV) {
    state.form.username = 'system';
    state.form.password = 'Abcd@1234..';
  }
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
        <LoginHeader />

        <a-card :bordered="true" :style="{ width: '100%', maxWidth: '400px' }">
          <a-form :model="state.form" name="StateForm" @finish="fnFinish">
            <a-tabs
              v-model:activeKey="activeKey"
              tab-position="top"
              type="line"
              :centered="true"
              :destroy-inactive-tab-pane="true"
            >
              <a-tab-pane key="username" tab="账号密码登录">
                <UsernameLogin
                  v-model:username="state.form.username"
                  v-model:password="state.form.password"
                  v-model:code="state.form.code"
                  :captcha="state.captcha"
                  @refresh-captcha="fnGetCaptcha"
                />
              </a-tab-pane>

              <a-tab-pane key="phone" tab="手机号登录">
                <PhoneLogin
                  v-model:phone="state.form.phone"
                  v-model:code="state.form.code"
                  :sms-click="smsState.click"
                  :sms-time="smsState.time"
                  @send="fnGetSmsCaptcha"
                />
              </a-tab-pane>
            </a-tabs>

            <a-button
              block
              type="primary"
              size="large"
              html-type="submit"
              :loading="state.formClick"
            >
              登录
            </a-button>

            <OtherLogin />
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
