<script lang="ts" setup>
import { LockOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import { reactive } from 'vue';
import { updateUserPwd } from '@/api/system/user';
import { regExpPasswd } from '@/utils/regular-utils.js';
import useUserStore from '@/store/modules/user';
import { useRouter } from 'vue-router';
const { userName, fnLogOut } = useUserStore();
const router = useRouter();

let state = reactive({
  /**表单属性 */
  form: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  /**表单提交点击状态 */
  formClick: false,
});

/**表单验证确认密码是否一致 */
function fnEqualToPassword(
  rule: Record<string, any>,
  value: string,
  callback: (error?: string) => void
) {
  if (!value) {
    return Promise.reject('请输入确认新密码');
  }
  if (state.form.oldPassword === value) {
    return Promise.reject('与旧密码一致，请重新输入新密码');
  }
  if (state.form.newPassword === value) {
    return Promise.resolve();
  }
  return Promise.reject('两次输入的新密码不一致');
}

/**表单验证通过 */
function fnFinish() {
  Modal.confirm({
    title: '提示',
    content: `确认要提交修改密码吗?`,
    onOk() {
      state.formClick = true;
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      updateUserPwd(state.form.oldPassword, state.form.confirmPassword)
        .then(res => {
          hide();
          if (res.code === 200) {
            Modal.success({
              title: '提示',
              content: `恭喜您，${userName} 账号密码修改成功！`,
              okText: '重新登录',
              onOk() {
                fnLogOut().finally(() => router.push({ name: 'Login' }));
              },
            });
          } else {
            message.error(`${res.msg}`, 3);
          }
        })
        .finally(() => {
          state.formClick = false;
        });
    },
  });
}
</script>

<template>
  <a-form
    :model="state.form"
    name="stateForm"
    layout="vertical"
    :wrapper-col="{ span: 9 }"
    @finish="fnFinish"
  >
    <a-form-item
      label="旧密码"
      name="oldPassword"
      :rules="[
        {
          required: true,
          min: 6,
          max: 26,
          message: '旧密码不能为空，且不少于6位',
        },
      ]"
    >
      <a-input-password
        v-model:value="state.form.oldPassword"
        placeholder="请输入旧密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>
    <a-form-item
      label="新密码"
      name="newPassword"
      :rules="[
        {
          required: true,
          pattern: regExpPasswd,
          message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
        },
      ]"
    >
      <a-input-password
        v-model:value="state.form.newPassword"
        placeholder="请输入新密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>
    <a-form-item
      label="确认新密码"
      name="confirmPassword"
      :rules="[
        {
          required: true,
          validator: fnEqualToPassword,
        },
      ]"
    >
      <a-input-password
        v-model:value="state.form.confirmPassword"
        placeholder="请确认新密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item :wrapper-col="{ span: 3 }">
      <a-button
        block
        type="primary"
        html-type="submit"
        :loading="state.formClick"
      >
        提交修改
      </a-button>
    </a-form-item>
  </a-form>
</template>

<style lang="less" scoped></style>
