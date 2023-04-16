<script lang="ts" setup>
import {
  UserOutlined,
  LockOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue';
import { GlobalFooter } from '@ant-design-vue/pro-layout';
import { Modal, message } from 'ant-design-vue';
import { reactive, onMounted, toRaw } from 'vue';
import { getCaptchaImage, register } from '@/api/login';
import { regExpPasswd } from '@/utils/RegularUtils';
import { useRouter } from 'vue-router';
const router = useRouter();
const codeImgFall =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

let state = reactive({
  /**表单属性 */
  form: {
    /**账号 */
    username: '',
    /**密码 */
    password: '',
    /**确认密码 */
    confirmPassword: '',
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
    enabled: true,
    /**验证码图片地址 */
    codeImg: '',
    codeImgFall: codeImgFall,
  },
  /**验证码点击状态 */
  captchaClick: false,
});

/**表单验证确认密码是否一致 */
function fnEqualToPassword(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    return Promise.reject('请正确输入确认密码');
  }
  if (state.form.password === value) {
    return Promise.resolve();
  }
  return Promise.reject('两次输入的密码不一致');
}

/**表单验证通过 */
function fnFinish() {
  state.formClick = true;
  // 发送请求
  const hide = message.loading('请稍等...', 0);
  register(toRaw(state.form))
    .then(res => {
      hide();
      if (res.code === 200) {
        Modal.success({
          title: '提示',
          content: `恭喜您，${state.form.username} 账号注册成功！`,
          okText: '前往登录',
          onOk() {
            router.push({ name: 'Login' });
          },
        });
      } else {
        message.error(`${res.msg}`, 3);
        // 刷新验证码
        if (state.captcha.enabled) {
          state.form.code = '';
          fnGetCaptcha();
        }
      }
    })
    .finally(() => {
      state.formClick = false;
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
      state.form.uuid = res.uuid;
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
      <a-form :model="state.form" name="tabForm" @finish="fnFinish">
        <a-form-item
          name="username"
          :rules="[
            {
              required: true,
              min: 2,
              max: 18,
              message: '请输入正确登录账号',
            },
          ]"
        >
          <a-input
            v-model:value="state.form.username"
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
            {
              required: true,
              pattern: regExpPasswd,
              message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
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
          name="confirmPassword"
          :rules="[
            {
              required: true,
              min: 6,
              max: 26,
              validator: fnEqualToPassword,
            },
          ]"
        >
          <a-input-password
            v-model:value="state.form.confirmPassword"
            size="large"
            placeholder="确认登录密码"
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
              :rules="[{ required: true, min: 1, message: '请输入正确验证码' }]"
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

        <a-button
          block
          type="primary"
          size="large"
          html-type="submit"
          :loading="state.formClick"
          :disabled="state.formClick"
        >
          注册
        </a-button>
        <a-button
          block
          type="default"
          size="large"
          style="margin-top: 16px"
          @click="() => router.push({ name: 'Login' })"
        >
          使用已有账号登录
        </a-button>
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
