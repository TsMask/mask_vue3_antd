<script lang="ts" setup>
import { GlobalFooter } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import useUserStore from '@/store/modules/user';
import { getCaptchaImage } from '@/api/login';
import { regExpMobile, validMobile } from '@/utils/regular-utils';
import { useRouter, useRoute } from 'vue-router';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const router = useRouter();
const route = useRoute();
const codeImgFall =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**Tab默认激活 */
let activeKey = ref<'username' | 'phone'>('username');

let state = reactive({
  /**表单属性 */
  form: {
    /**账号 */
    username: 'system',
    /**密码 */
    password: 'Abcd@1234..',
    /**手机号 */
    phone: '',
    /**验证码 */
    code: '',
    /**验证码uuid */
    uuid: '',
  },
  /**表单提交点击状态 */
  formClick: false,
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
        /**登录后重定向页面 */
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
      // 刷新验证码
      if (state.captcha.enabled) {
        state.form.code = '';
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
  if (!validMobile(state.form.phone)) {
    message.warning({
      content: '请确认手机号码是否有效！',
      duration: 3,
    });
    return;
  }
  smsState.click = true;

  setTimeout(() => {
    // start 得到发送结果启动定时
    message.success({
      content: '发送成功，请注意查看短信！',
      duration: 3,
    });
    state.form.uuid = '短信校验id';
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
          <span class="title">Mask Antd Vue3</span>
        </a>
      </div>
      <div class="desc">基于 ant-design-vue + vue3 的管理系统</div>
    </div>

    <a-card :bordered="true" class="main">
      <a-form :model="state.form" name="StateForm" @finish="fnFinish">
        <a-tabs
          v-model:activeKey="activeKey"
          tabPosition="top"
          type="line"
          :centered="true"
          :destroy-inactive-tab-pane="true"
        >
          <a-tab-pane key="username" tab="账号密码登录">
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
                v-model:value="state.form.username"
                size="large"
                placeholder="登录账号"
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
                  message: '请输入正确登录密码',
                },
              ]"
            >
              <a-input-password
                v-model:value="state.form.password"
                size="large"
                placeholder="登录密码"
                :maxlength="26"
              >
                <template #prefix>
                  <LockOutlined class="prefix-icon" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item
              v-if="state.captcha.enabled"
              name="code"
              :rules="[{ required: true, min: 1, message: '请输入正确验证码' }]"
            >
              <a-input-group compact>
                <a-input
                  v-model:value="state.form.code"
                  size="large"
                  placeholder="验证码"
                  :maxlength="6"
                  style="width: calc(100% - 120px)"
                >
                  <template #prefix>
                    <RobotOutlined class="prefix-icon" />
                  </template>
                </a-input>
                <a-image
                  alt="验证码"
                  style="cursor: pointer; border-radius: inherit"
                  width="120px"
                  height="40px"
                  :preview="false"
                  :src="state.captcha.codeImg"
                  :fallback="state.captcha.codeImgFall"
                  @click="fnGetCaptcha"
                />
              </a-input-group>
            </a-form-item>

            <a-form-item>
              <a-space direction="horizontal" :size="8">
                <a-button
                  size="small"
                  type="link"
                  target="_self"
                  title="注册账号"
                  @click="() => router.push({ name: 'Register' })"
                >
                  注册账号
                </a-button>
                <a-button size="small" type="link">忘记密码</a-button>
              </a-space>
            </a-form-item>
          </a-tab-pane>

          <a-tab-pane key="phone" tab="手机号登录">
            <a-form-item
              name="phone"
              :rules="[
                {
                  required: true,
                  pattern: regExpMobile,
                  message: '请输入正确的手机号码',
                },
              ]"
            >
              <a-input
                v-model:value="state.form.phone"
                size="large"
                placeholder="手机号码"
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
                { required: true, min: 4, message: '请输入正确的验证码' },
              ]"
            >
              <a-input
                v-model:value="state.form.code"
                size="large"
                placeholder="验证码"
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
                    {{ smsState.click ? `${smsState.time} s` : '获取验证码' }}
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
          :loading="state.formClick"
        >
          登录
        </a-button>

        <a-row :gutter="8" align="middle" style="margin-top: 18px">
          <a-col :span="24">
            <span>其他登录方式：</span>
            <a-tooltip title="微信扫一扫登录" placement="bottom">
              <a-button shape="circle" size="middle" type="link">
                <template #icon>
                  <WechatOutlined
                    :style="{ color: '#52c41a', fontSize: '18px' }"
                  />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="QQ扫码登录" placement="bottom">
              <a-button shape="circle" size="middle" type="link">
                <template #icon>
                  <QqOutlined :style="{ color: '#40a9ff', fontSize: '18px' }" />
                </template>
              </a-button>
            </a-tooltip>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <GlobalFooter
      class="footer"
      :links="[
        { blankTarget: false, title: '帮助', href: '/' },
        { blankTarget: false, title: '隐私', href: '/' },
        { blankTarget: false, title: '条款', href: '/' },
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
[data-theme='dark'] .container {
  background-color: #141414;
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
      color: inherit;
      opacity: 0.85;
      font-weight: 600;
      font-size: 33px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
    }
  }

  .desc {
    margin-top: 12px;
    margin-bottom: 40px;
    color: inherit;
    opacity: 0.65;
    font-size: 14px;
  }
}

[data-theme='dark'] .top .header .title {
  color: rgba(255, 255, 255, 0.85);
}
[data-theme='dark'] .top .desc {
  color: rgba(255, 255, 255, 0.45);
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
[data-theme='dark'] .footer {
  color: rgba(255, 255, 255, 0.85);
}
</style>
