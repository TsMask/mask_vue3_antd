<script lang="ts" setup>
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  RobotOutlined,
  WechatOutlined,
  QqOutlined,
} from '@ant-design/icons-vue';
import { GlobalFooter } from '@ant-design-vue/pro-layout';
import { ref, reactive, onMounted } from 'vue';
import useUserStore from '@/store/modules/user';
import { getCaptchaImage } from '@/api/login';
import { useRouter } from 'vue-router';
const router = useRouter();

/**Tab默认激活 */
let tabActiveKey = ref<'username' | 'phonenumber'>('username');

/**Tab表单属性 */
let tabForm = reactive({
  /**账号 */
  username: 'admin',
  /**密码 */
  password: 'admin@1234',
  /**验证码 */
  code: '',
  /**手机号 */
  phonenumber: '',
  /**提交点击状态 */
  click: false,
});

/**验证码状态 */
let captchaState = reactive({
  /**验证码开关 */
  enabled: true,
  /**验证码uuid */
  uuid: '',
  /**验证码图片地址 */
  codeImg: '',
  codeImgFall:
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  /**短信发送倒计时 */
  time: 120,
  /**短信发送点击状态 */
  click: false,
});

/**表单验证通过 */
function fnFinish() {
  tabForm.click = true;
  let form = {};
  // 账号密码登录
  if (tabActiveKey.value === 'username') {
    form = {
      username: tabForm.username,
      password: tabForm.password,
      code: tabForm.code,
      uuid: captchaState.uuid,
    };
  }
  // 手机号登录
  if (tabActiveKey.value === 'phonenumber') {
    form = {
      phonenumber: tabForm.phonenumber,
      code: tabForm.code,
      uuid: captchaState.uuid,
    };
  }
  // 发送请求
  useUserStore()
    .fnLogin(form)
    .then(res => {
      if (res.code !== 500) {
        router.push({ name: 'Index' });
      } else {
        tabForm.click = false;
        // 刷新验证码
        if (captchaState.enabled) {
          fnGetCaptcha();
        }
      }
    });
}

/**
 * 获取验证码
 */
function fnGetCaptcha() {
  getCaptchaImage().then(res => {
    captchaState.enabled = Boolean(res.captchaEnabled);
    if (captchaState.enabled) {
      captchaState.codeImg = res.img;
      captchaState.uuid = res.uuid;
    }
  });
}

onMounted(() => {
  fnGetCaptcha();
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
      <a-form :model="tabForm" name="tabForm" @finish="fnFinish">
        <a-tabs
          v-model:activeKey="tabActiveKey"
          tabPosition="top"
          type="line"
          :centered="true"
          :destroy-inactive-tab-pane="true"
        >
          <a-tab-pane key="username" tab="账号密码登录">
            <a-form-item
              name="username"
              :rules="[
                { required: true, min: 2, message: '请输入正确登录账号' },
              ]"
            >
              <a-input
                v-model:value="tabForm.username"
                size="large"
                placeholder="登录账号"
                :maxlength="18"
              >
                <template #prefix>
                  <UserOutlined class="prefix-icon" />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item
              name="password"
              :rules="[
                { required: true, min: 6, message: '请输入正确登录密码' },
              ]"
            >
              <a-input-password
                v-model:value="tabForm.password"
                size="large"
                placeholder="登录密码"
                :maxlength="26"
              >
                <template #prefix>
                  <LockOutlined class="prefix-icon" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-row :gutter="8">
              <a-col :span="16">
                <a-form-item
                  name="code"
                  :rules="[{ required: true, message: '请输入正确验证码' }]"
                >
                  <a-input
                    v-model:value="tabForm.code"
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
                  :src="captchaState.codeImg"
                  :fallback="captchaState.codeImgFall"
                  @click="fnGetCaptcha"
                />
              </a-col>
            </a-row>

            <a-row :gutter="8" align="middle" style="margin-bottom: 16px">
              <a-col :span="6">
                <a-button type="link">注册账户</a-button>
              </a-col>
              <a-col :span="6" :offset="12">
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
                  pattern: /^1\d{10}$/,
                  message: '请输入正确的手机号码',
                },
              ]"
            >
              <a-input
                v-model:value="tabForm.phonenumber"
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
              :rules="[{ required: true, message: '请输入正确的验证码' }]"
            >
              <a-input
                v-model:value="tabForm.code"
                size="large"
                placeholder="验证码"
                :maxlength="6"
              >
                <template #prefix>
                  <RobotOutlined class="prefix-icon" />
                </template>
                <template #suffix>
                  <a-button size="small" type="link">获取验证码</a-button>
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
          :loading="tabForm.click"
          >登 录</a-button
        >

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
                <template #icon
                  ><QqOutlined :style="{ color: '#40a9ff', fontSize: '18px' }"
                /></template>
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

<style lang="less">
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
