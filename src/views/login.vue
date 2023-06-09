<script lang="ts" setup>
import { GlobalFooter } from '@ant-design-vue/pro-layout';
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import useUserStore from '@/store/modules/user';
import { getCaptchaImage } from '@/api/login';
import { regExpMobile, validMobile } from '@/utils/regular-utils.js';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue/lib';
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
        message.success('登录成功', 3);
        router.push({ path: redirectPath });
      } else {
        message.error(`${res.msg}`, 3);
        // 刷新验证码
        if (state.captcha.enabled) {
          state.from.code = '';
          fnGetCaptcha();
        }
      }
    })
    .finally(() => {
      state.fromClick = false;
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
    message.warning('请确认手机号码是否有效', 3);
    return;
  }
  smsState.click = true;

  setTimeout(() => {
    // start 得到发送结果启动定时
    message.success('发送成功，请注意查看短信', 3);
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

    <div class="main">
      <a-form :model="state.from" name="stateFrom" @finish="fnFinish">
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
                v-model:value="state.from.username"
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
                v-model:value="state.from.password"
                size="large"
                placeholder="登录密码"
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
                    { required: true, min: 1, message: '请输入正确验证码' },
                  ]"
                >
                  <a-input
                    v-model:value="state.from.code"
                    size="large"
                    placeholder="验证码"
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
                  alt="验证码"
                  class="captcha-img"
                  :preview="false"
                  :src="state.captcha.codeImg"
                  :fallback="state.captcha.codeImgFall"
                  @click="fnGetCaptcha"
                />
              </a-col>
            </a-row>

            <a-row :gutter="8" align="middle" style="margin-bottom: 16px">
              <a-col :span="6">
                <a-button
                  type="link"
                  target="_self"
                  title="注册账号"
                  @click="() => router.push({ name: 'Register' })"
                >
                  注册账号
                </a-button>
              </a-col>
              <a-col :span="6" :offset="12" v-if="false">
                <a-button type="link">忘记密码</a-button>
              </a-col>
            </a-row>
          </a-tab-pane>

          <a-tab-pane key="phonenumber" tab="手机号登录">
            <a-form-item
              name="phonenumber"
              :rules="[
                {
                  required: true,
                  pattern: regExpMobile,
                  message: '请输入正确的手机号码',
                },
              ]"
            >
              <a-input
                v-model:value="state.from.phonenumber"
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
                v-model:value="state.from.code"
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
          :loading="state.fromClick"
        >
          登录
        </a-button>

        <a-row :gutter="8" align="middle" style="margin-top: 18px">
          <a-col :span="24">
            <span>其他登录方式：</span>
            <a-tooltip title="微信扫一扫登录">
              <a-button shape="circle" size="middle" type="link">
                <template #icon>
                  <WechatOutlined
                    :style="{ color: '#52c41a', fontSize: '18px' }"
                  />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="QQ扫码登录">
              <a-button shape="circle" size="middle" type="link">
                <template #icon>
                  <QqOutlined :style="{ color: '#40a9ff', fontSize: '18px' }" />
                </template>
              </a-button>
            </a-tooltip>
          </a-col>
        </a-row>
      </a-form>
    </div>

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

  .captcha-img {
    width: 120px;
    height: 40px;
    overflow: hidden;
    cursor: pointer;
    border-radius: 2px;
  }
}

.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
}
</style>
