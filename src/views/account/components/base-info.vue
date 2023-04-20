<script lang="ts" setup>
import { Modal, message } from 'ant-design-vue';
import { onMounted, reactive, ref, toRaw } from 'vue';
import { updateUserProfile, uploadAvatar } from '@/api/system/user';
import { regExpEmail, regExpMobile, regExpNick } from '@/utils/regular-utils.js';
import useUserStore from '@/store/modules/user';
import useDictStore from '@/store/modules/dict';
import { FileType } from 'ant-design-vue/es/upload/interface';
import { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';
const uerStore = useUserStore();
const { getDict } = useDictStore();

/**用户性别字典 */
let sysUserSex = ref<DictType[]>([]);

/**表单数据状态 */
let stateForm = reactive({
  /**表单属性 */
  form: {
    nickName: '',
    email: '',
    phonenumber: '',
    sex: undefined,
  },
  /**表单提交点击状态 */
  formClick: false,
});

/**表单数据状态初始化 */
function fnInitstateForm() {
  stateForm.form = Object.assign(stateForm.form, uerStore.getBaseInfo);
  stateForm.formClick = false;
}

/**表单验证通过 */
function fnFinish() {
  Modal.confirm({
    title: '提示',
    content: `确认要提交修改用户基本信息吗?`,
    onOk() {
      stateForm.formClick = true;
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      const form = toRaw(stateForm.form);
      updateUserProfile(form).then(res => {
        hide();
        stateForm.formClick = false;
        if (res.code === 200) {
          Modal.success({
            title: '提示',
            content: `用户基本信息修改成功！`,
            okText: '我知道了',
            onOk() {
              uerStore.setBaseInfo(form);
            },
          });
        } else {
          message.error(`${res.msg}`, 3);
        }
      });
    },
  });
}

/**上传状态 */
let upState = ref<boolean>(false);

/**上传前检查或转换压缩 */
function fnBeforeUpload(file: FileType) {
  if (upState.value) return false;
  const isJpgOrPng = ['image/jpeg', 'image/png'].includes(file.type);
  if (!isJpgOrPng) {
    message.error('只支持上传图片格式（jpg、png）', 3);
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片文件大小必须小于 2MB', 3);
  }
  return isJpgOrPng && isLt2M;
}

/**上传变更 */
function fnUpload(up: UploadRequestOption) {
  Modal.confirm({
    title: '提示',
    content: `确认要头上传/变更用户头像吗?`,
    onOk() {
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      upState.value = true;
      let formData = new FormData();
      formData.append('file', up.file);
      uploadAvatar(formData).then(res => {
        upState.value = false;
        hide();
        if (res.code === 200) {
          message.success('头像上传/变更成功', 3);
          uerStore.setAvatar(res.data);
        } else {
          message.error(res.msg, 3);
        }
      });
    },
  });
}

onMounted(() => {
  // 初始字典数据
  getDict('sys_user_sex').then(res => {
    sysUserSex.value = res;
  });
  // 初始表单值
  fnInitstateForm();
});
</script>

<template>
  <a-form
    :model="stateForm.form"
    name="stateForm"
    layout="vertical"
    :wrapper-col="{ span: 18 }"
    @finish="fnFinish"
  >
    <a-row :gutter="16">
      <a-col :lg="12" :md="12" :xs="24">
        <a-form-item
          label="用户昵称"
          name="nickName"
          :rules="[
            {
              required: true,
              pattern: regExpNick,
              message: '昵称只能包含字母、数字、中文和下划线，且不少于2位',
            },
          ]"
        >
          <a-input
            v-model:value="stateForm.form.nickName"
            allow-clear
            :maxlength="26"
            placeholder="请输入用户昵称"
          ></a-input>
        </a-form-item>

        <a-form-item
          label="手机号码"
          name="phonenumber"
          :rules="[
            {
              required: false,
              pattern: regExpMobile,
              message: '请输入正确手机号码',
            },
          ]"
        >
          <a-input
            v-model:value="stateForm.form.phonenumber"
            allow-clear
            :maxlength="11"
            placeholder="请输入手机号码"
          ></a-input>
        </a-form-item>

        <a-form-item
          label="电子邮箱"
          name="email"
          :rules="[
            {
              required: false,
              pattern: regExpEmail,
              message: '请输入正确电子邮箱',
            },
          ]"
        >
          <a-input
            v-model:value="stateForm.form.email"
            allow-clear
            :maxlength="40"
            placeholder="请输入电子邮箱"
          ></a-input>
        </a-form-item>

        <a-form-item
          label="用户性别"
          name="sex"
          :rules="[
            {
              required: true,
              message: '请选择用户性别',
            },
          ]"
        >
          <a-select
            v-model:value="stateForm.form.sex"
            placeholder="用户性别"
            :options="sysUserSex"
          >
          </a-select>
        </a-form-item>

        <a-space :size="8">
          <a-button
            block
            type="primary"
            html-type="submit"
            :loading="stateForm.formClick"
          >
            确认修改
          </a-button>
          <a-button
            type="default"
            @click="fnInitstateForm"
            :disabled="stateForm.formClick"
          >
            重置
          </a-button>
        </a-space>
      </a-col>
      <a-col :lg="12" :md="12" :xs="24">
        <a-space direction="vertical" :size="16">
          <a-image :width="128" :height="128" :src="uerStore.getAvatar" />
          <span>请选择等比大小图片作为头像，如200x200、400x400</span>
          <a-upload
            name="file"
            list-type="picture"
            :max-count="1"
            :show-upload-list="false"
            :before-upload="fnBeforeUpload"
            :custom-request="fnUpload"
          >
            <a-button type="default" :loading="upState">
              上传/变更图片
            </a-button>
          </a-upload>
        </a-space>
      </a-col>
    </a-row>
  </a-form>
</template>

<style lang="less" scoped>
.avatar {
  width: 100px;
  height: 100px;
}
</style>
