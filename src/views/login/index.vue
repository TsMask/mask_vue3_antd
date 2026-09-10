<script lang="ts" setup>
import { message } from 'ant-design-vue';
import type { CSSProperties } from 'vue';
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import background from '@/assets/background.svg';
import useUserStore from '@/store/modules/user';
import { getCaptchaImage, getCaptchaSMS } from '@/api/auth';
import { validMobile } from '@/utils/regular-utils';
import { isSuccess } from '@/plugins/http-fetch';
import { useRouter, useRoute } from 'vue-router';
import LoginHeader from './components/LoginHeader.vue';
import LoginFooter from './components/LoginFooter.vue';
import UsernameLogin from './components/UsernameLogin.vue';
import PhoneLogin from './components/PhoneLogin.vue';
import OtherLogin from './components/OtherLogin.vue';

type LoginTabKey = 'username' | 'phone';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
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

const activeKey = ref<LoginTabKey>('username');

const state = reactive({
  form: {
    username: '',
    password: '',
    phone: '',
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

/** 表单验证通过后按登录通道提交 */
async function handleSubmit() {
  const loginForm: Record<string, string> =
    activeKey.value === 'phone'
      ? {
          phone: state.form.phone,
          code: state.form.code,
          uuid: state.form.uuid,
        }
      : {
          username: state.form.username,
          password: state.form.password,
          code: state.form.code,
          uuid: state.form.uuid,
        };

  state.submitting = true;
  try {
    const res = await userStore.fnLogin(loginForm);
    if (!isSuccess(res)) {
      message.error({
        content: res.msg || '登录失败',
        duration: 3,
      });
      return;
    }

    message.success({
      content: '登录成功',
      duration: 3,
    });

    const redirectQuery = route.query.redirect;
    const redirectPath = Array.isArray(redirectQuery)
      ? redirectQuery[0]
      : redirectQuery;
    router.push({ path: redirectPath || '/index' });
  } catch (error: any) {
    message.error({
      content: error?.message || '登录失败，请稍后重试',
      duration: 3,
    });
  } finally {
    state.submitting = false;
    state.form.code = '';
    if (activeKey.value === 'username' && state.captcha.enabled) {
      handleGetCaptcha();
    }
  }
}

/** 获取账号登录图形验证码 */
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
      state.captcha.codeImg = img ?? state.captcha.codeImgFall;
      state.form.uuid = uuid ?? '';
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

/** 获取手机号登录短信验证码 */
async function handleSendSmsCaptcha() {
  if (smsState.counting) return;
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

/** 切换通道后，两种验证码的编码不能混用。 */
function handleTabChange() {
  state.form.code = '';
  state.form.uuid = '';
  if (activeKey.value === 'username' && state.captcha.enabled) {
    handleGetCaptcha();
  }
}

watch(activeKey, handleTabChange);

onMounted(() => {
  handleGetCaptcha();
  if (import.meta.env.DEV) {
    state.form.username = 'system';
    state.form.password = 'Abcd@1234..';
  }
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
        <LoginHeader />

        <a-card :bordered="true" :style="{ width: '100%', maxWidth: '400px' }">
          <a-form :model="state.form" name="LoginForm" @finish="handleSubmit">
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
                  @refresh-captcha="handleGetCaptcha"
                />
              </a-tab-pane>

              <a-tab-pane key="phone" tab="手机号登录">
                <PhoneLogin
                  v-model:phone="state.form.phone"
                  v-model:code="state.form.code"
                  :counting="smsState.counting"
                  :countdown="smsState.countdown"
                  @send="handleSendSmsCaptcha"
                />
              </a-tab-pane>
            </a-tabs>

            <a-button
              block
              type="primary"
              size="large"
              html-type="submit"
              :loading="state.submitting"
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
