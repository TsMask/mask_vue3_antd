<script lang="ts" setup>
import { reactive } from 'vue';
import { Modal, message } from 'ant-design-vue';
import { updateUserPassword } from '@/api/profile';
import { regExpPassword } from '@/utils/regular-utils';
import useUserStore from '@/store/modules/user';
import { useRouter } from 'vue-router';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { user_name, fnLogOut } = useUserStore();
const router = useRouter();

let state = reactive({
  /**表单属性 */
  form: {
    old_password: '',
    new_password: '',
    confirm_password: '',
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
  if (state.form.old_password === value) {
    return Promise.reject('与旧密码一致，请重新输入新密码');
  }
  if (state.form.new_password === value) {
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
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      state.formClick = true;
      updateUserPassword(state.form.old_password, state.form.confirm_password)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            Modal.success({
              title: '提示',
              content: `恭喜您，${user_name} 账号密码修改成功！`,
              okText: '重新登录',
              onOk() {
                fnLogOut().finally(() => router.push({ name: 'Login' }));
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
        });
    },
  });
}
</script>

<template>
  <a-form
    :model="state.form"
    name="stateForm"
    :wrapper-col="{ lg: 8, md: 12, xs: 14 }"
    :label-col="{ lg: 4, md: 4, xs: 6 }"
    :label-warp="true"
    @finish="fnFinish"
  >
    <a-form-item
      label="旧密码"
      name="old_password"
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
        v-model:value="state.form.old_password"
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
      name="new_password"
      :rules="[
        {
          required: true,
          pattern: regExpPassword,
          message: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
        },
      ]"
    >
      <a-input-password
        v-model:value="state.form.new_password"
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
      name="confirm_password"
      :rules="[
        {
          required: true,
          validator: fnEqualToPassword,
        },
      ]"
    >
      <a-input-password
        v-model:value="state.form.confirm_password"
        placeholder="请确认新密码"
        :maxlength="26"
      >
        <template #prefix>
          <LockOutlined class="prefix-icon" />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item :wrapper-col="{ offset: 2 }">
      <a-button type="primary" html-type="submit" :loading="state.formClick">
        提交修改
      </a-button>
    </a-form-item>
  </a-form>
</template>

<style scoped></style>
