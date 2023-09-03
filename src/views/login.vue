<script lang="ts" setup>
import { GlobalFooter } from '@ant-design-vue/pro-layout';
import { message } from 'ant-design-vue/lib';
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import useUserStore from '@/store/modules/user';
import { getCaptchaImage } from '@/api/login';
import useI18n from '@/hooks/useI18n';
import { regExpMobile, validMobile } from '@/utils/regular-utils';
import { useRouter, useRoute } from 'vue-router';
const { t, changeLocale } = useI18n();
const router = useRouter();
const route = useRoute();
const codeImgFall =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**登录后重定向页面 */
const redirectPath =
  (route.query && (route.query.redirect as string)) || '/index';

/**Tab默认激活 */
let activeKey = ref<'username' | 'phonenumber'>('username');

let state = reactive({
  /**表单属性 */
  from: {
    /**账号 */
    username: 'maskAdmin',
    /**密码 */
    password: 'Admin@1234',
    /**手机号 */
    phonenumber: '',
    /**验证码 */
    code: '',
    /**验证码uuid */
    uuid: '',
  },
  /**表单提交点击状态 */
  fromClick: false,
  /**验证码状态 */
  captcha: {
    /**验证码开关 */
    enabled: false,
    /**验证码图片地址 */
    codeImg: '',
    codeImgFall: codeImgFall,
  },
  /**验证码点击状态 */
  captchaClick: false,
});

/**表单验证通过 */
function fnFinish() {
  state.fromClick = true;
  let form = {};
  // 账号密码登录
  if (activeKey.value === 'username') {
    form = {
      username: state.from.username,
      password: state.from.password,
      code: state.from.code,
      uuid: state.from.uuid,
    };
  }
  // 手机号登录
  if (activeKey.value === 'phonenumber') {
    form = {
      phonenumber: state.from.phonenumber,
      code: state.from.code,
      uuid: state.from.uuid,
    };
  }
  // 发送请求
  useUserStore()
    .fnLogin(form)
    .then(res => {
      if (res.code === 200) {
        message.success(t('views.login.loginSuccess'), 3);
        router.push({ path: redirectPath });
      } else {
        message.error(`${res.msg}`, 3);
      }
    })
    .finally(() => {
      state.fromClick = false;
      // 刷新验证码
      if (state.captcha.enabled) {
        state.from.code = '';
        fnGetCaptcha();
      }
    });
}

/**
 * 获取验证码
 */
function fnGetCaptcha() {
  if (state.captchaClick) return;
  state.captchaClick = true;
  getCaptchaImage().then(res => {
    state.captchaClick = false;
    if (res.code != 200) {
      message.warning(`${res.msg}`, 3);
      return;
    }
    state.captcha.enabled = Boolean(res.captchaEnabled);
    if (state.captcha.enabled) {
      state.captcha.codeImg = res.img;
      state.from.uuid = res.uuid;
    }
  });
}

/**短信验证码定时器 */
let smsInterval: any = undefined;

/**短信验证码信息状态 */
let smsState = reactive({
  /**点击状态 */
  click: false,
  /**发送倒计时 */
  time: 120,
});

/**获取短信验证码 */
function fnGetSmsCaptcha() {
  if (smsState.click) return;
  if (!validMobile(state.from.phonenumber)) {
    message.warning(t('valid.phoneReg'), 3);
    return;
  }
  smsState.click = true;

  setTimeout(() => {
    // start 得到发送结果启动定时
    message.success(t('valid.codeSmsSend'), 3);
    state.from.uuid = '短信校验id';
    smsInterval = setInterval(() => {
      if (smsState.time <= 0) {
        smsState.time = 120;
        smsState.click = false;
        clearTimeout(smsInterval);
      } else {
        smsState.time--;
      }
    }, 1000);
    // end
  }, 1000);
}

/**改变多语言 */
function fnChangeLocale(e: any) {
  changeLocale(e.key);
}

onMounted(() => {
  fnGetCaptcha();
});

onBeforeUnmount(() => {
  smsState.time = 120;
  smsState.click = false;
  clearTimeout(smsInterval);
});
</script>

<template>
  <div class="container">
    <div class="top">
      <div class="header">
        <a href="/" target="_self"
          ><img src="@/assets/logo.png" class="logo" alt="logo" />
          <span class="title">{{ t('common.title') }}</span>
        </a>
      </div>
      <div class="desc">{{ t('common.desc') }}</div>
    </div>

    <div class="main">
      <a-form :model="state.from" name="stateFrom" @finish="fnFinish">
        <a-tabs
          v-model:activeKey="activeKey"
          tabPosition="top"
          type="line"
          :centered="true"
          :destroy-inactive-tab-pane="true"
        >
          <a-tab-pane key="username" :tab="t('views.login.tabPane1')">
            <a-form-item
              name="username"
              :rules="[
                {
                  required: true,
                  min: 2,
                  max: 30,
                  message: t('valid.userNamePlease'),
                },
              ]"
            >
              <a-input
                v-model:value="state.from.username"
                size="large"
                :placeholder="t('valid.userNameHit')"
                :maxlength="30"
              >
                <template #prefix>
                  <UserOutlined class="prefix-icon" />
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
                  message: t('valid.passwordPlease'),
                },
              ]"
            >
              <a-input-password
                v-model:value="state.from.password"
                size="large"
                :placeholder="t('valid.passwordHit')"
                :maxlength="26"
              >
                <template #prefix>
                  <LockOutlined class="prefix-icon" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-row :gutter="8" v-if="state.captcha.enabled">
              <a-col :span="16">
                <a-form-item
                  name="code"
                  :rules="[
                    {
                      required: true,
                      min: 1,
                      message: t('valid.codePlease'),
                    },
                  ]"
                >
                  <a-input
                    v-model:value="state.from.code"
                    size="large"
                    :placeholder="t('valid.codeHit')"
                    :maxlength="6"
                  >
                    <template #prefix>
                      <RobotOutlined class="prefix-icon" />
                    </template>
                  </a-input>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-image
                  :alt="t('valid.codeHit')"
                  style="cursor: pointer; border-radius: 2px"
                  width="120px"
                  height="40px"
                  :preview="false"
                  :src="state.captcha.codeImg"
                  :fallback="state.captcha.codeImgFall"
                  @click="fnGetCaptcha"
                />
              </a-col>
            </a-row>

            <a-row
              :gutter="8"
              justify="space-between"
              align="middle"
              style="margin-bottom: 16px"
            >
              <a-col :span="12">
                <a-button
                  type="link"
                  target="_self"
                  :title="t('views.login.registerBtn')"
                  @click="() => router.push({ name: 'Register' })"
                >
                  {{ t('views.login.registerBtn') }}
                </a-button>
              </a-col>
            </a-row>
          </a-tab-pane>

          <a-tab-pane key="phonenumber" :tab="t('views.login.tabPane2')">
            <a-form-item
              name="phonenumber"
              :rules="[
                {
                  required: true,
                  pattern: regExpMobile,
                  message: t('valid.phonePlease'),
                },
              ]"
            >
              <a-input
                v-model:value="state.from.phonenumber"
                size="large"
                :placeholder="t('valid.phoneHit')"
                :maxlength="11"
              >
                <template #prefix>
                  <MobileOutlined class="prefix-icon" />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item
              name="code"
              :rules="[
                {
                  required: true,
                  min: 4,
                  message: t('valid.codePlease'),
                },
              ]"
            >
              <a-input
                v-model:value="state.from.code"
                size="large"
                :placeholder="t('valid.codeHit')"
                :maxlength="6"
              >
                <template #prefix>
                  <RobotOutlined class="prefix-icon" />
                </template>
                <template #suffix>
                  <a-button
                    size="small"
                    type="link"
                    :disabled="smsState.click"
                    @click="fnGetSmsCaptcha"
                  >
                    {{
                      smsState.click
                        ? `${smsState.time} s`
                        : t('valid.codeText')
                    }}
                  </a-button>
                </template>
              </a-input>
            </a-form-item>
          </a-tab-pane>
        </a-tabs>

        <a-button
          block
          type="primary"
          size="large"
          html-type="submit"
          :loading="state.fromClick"
        >
          {{ t('views.login.loginBtn') }}
        </a-button>

        <a-row
          :gutter="8"
          justify="space-between"
          align="middle"
          style="margin-top: 18px"
        >
          <a-col :span="18">
            <span>{{ t('views.login.loginMethod') }}</span>
            <a-tooltip :title="t('views.login.loginMethodWX')">
              <a-button shape="circle" size="middle" type="link">
                <template #icon>
                  <WechatOutlined
                    :style="{ color: '#52c41a', fontSize: '18px' }"
                  />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip :title="t('views.login.loginMethodQQ')">
              <a-button shape="circle" size="middle" type="link">
                <template #icon>
                  <QqOutlined :style="{ color: '#40a9ff', fontSize: '18px' }" />
                </template>
              </a-button>
            </a-tooltip>
          </a-col>
          <a-col :span="6">
            <a-dropdown :trigger="['click', 'hover']">
              <a-button size="small" type="default">
                {{ t('i18n') }}
                <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu @click="fnChangeLocale">
                  <a-menu-item key="zhCN">中文</a-menu-item>
                  <a-menu-item key="enUS">English</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <GlobalFooter
      class="footer"
      :links="[
        { blankTarget: false, title: t('globalFooter.help'), href: '/' },
        { blankTarget: false, title: t('globalFooter.privacy'), href: '/' },
        { blankTarget: false, title: t('globalFooter.term'), href: '/' },
      ]"
      copyright="Copyright © 2023 Gitee For TsMask"
    >
    </GlobalFooter>
  </div>
</template>

<style lang="less" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: 110px 0 144px;
  background-image: url(../assets/background.svg);
  background-repeat: no-repeat;
  background-position: center 110px;
  background-size: 100%;
}

.top {
  text-align: center;

  a {
    text-decoration: none;
  }

  .header {
    height: 44px;
    line-height: 44px;
    .logo {
      height: 44px;
      margin-right: 16px;
      vertical-align: top;
      border-style: none;
      border-radius: 6.66px;
    }
    .title {
      position: relative;
      top: 2px;
      color: rgba(0, 0, 0, 0.85);
      font-weight: 600;
      font-size: 33px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
    }
  }

  .desc {
    margin-top: 12px;
    margin-bottom: 40px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
  }
}

.main {
  width: 368px;
  min-width: 260px;
  margin: 0 auto;

  .prefix-icon {
    color: #8c8c8c;
    font-size: 16px;
  }
}

.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
}
</style>
