<script lang="ts" setup>
import { onMounted, reactive, ref, toRaw } from 'vue';
import { Modal, message } from 'ant-design-vue';
import type { FileType } from 'ant-design-vue/es/upload/interface';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';
import { uploadFile } from '@/api/tool/file';
import { updateUserProfile } from '@/api/profile';
import { regExpEmail, regExpMobile, regExpNick } from '@/utils/regular-utils';
import useUserStore from '@/store/modules/user';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const userStore = useUserStore();
const { getDict } = useDictStore();

/**用户性别字典 */
let userSexOptions = ref<DictType[]>([
  { label: '未选择', value: '0', tagType: '', tagClass: '' },
  { label: '男', value: '1', tagType: '', tagClass: '' },
  { label: '女', value: '2', tagType: '', tagClass: '' },
]);

/**表单数据状态 */
let stateForm = reactive({
  /**表单属性 */
  form: {
    nickName: '',
    email: '',
    phone: '',
    sex: undefined,
    avatar: '',
  },
  /**表单提交点击状态 */
  formClick: false,
});

/**表单数据状态初始化 */
function fnInitstateForm() {
  Object.assign(stateForm.form, userStore.getBaseInfo);
  stateForm.formClick = false;
}

/**表单验证通过 */
function fnFinish() {
  Modal.confirm({
    title: '提示',
    content: `确认要提交修改用户基本信息吗?`,
    onOk() {
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      stateForm.formClick = true;
      const form = toRaw(stateForm.form);
      updateUserProfile(form)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            Modal.success({
              title: '提示',
              content: `用户基本信息修改成功！`,
              okText: '我知道了',
              onOk() {
                userStore.setBaseInfo(form);
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
          stateForm.formClick = false;
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
    message.error({
      content: '只支持上传图片格式（jpg、png）',
      duration: 3,
    });
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error({
      content: '图片文件大小必须小于 2MB',
      duration: 3,
    });
  }
  return isJpgOrPng && isLt2M;
}

/**上传变更 */
function fnUpload(up: UploadRequestOption) {
  Modal.confirm({
    title: '提示',
    content: `确认要上传/变更用户头像吗?`,
    onOk() {
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      upState.value = true;
      let formData = new FormData();
      formData.append('file', up.file);
      formData.append('subPath', 'avatar');
      uploadFile(formData)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            return res.data.filePath;
          }
          return '';
        })
        .then(filePath => {
          if (filePath === '') return undefined;
          const form = toRaw(stateForm.form);
          form.avatar = filePath;
          return updateUserProfile(form);
        })
        .then(res => {
          if (res === undefined) return;
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: '头像变更成功！',
              duration: 3,
            });
            userStore.setAvatar(stateForm.form.avatar);
          } else {
            message.error(res.msg, 3);
          }
        })
        .finally(() => {
          hide();
          upState.value = false;
        });
    },
  });
}

onMounted(() => {
  // 初始字典数据
  getDict('sys_user_sex').then(res => {
    if (res.length > 0) {
      userSexOptions.value = res;
    }
  });
  // 初始表单值
  fnInitstateForm();
});
</script>

<template>
  <a-form
    :model="stateForm.form"
    name="stateForm"
    :wrapper-col="{ lg: 12, md: 16, xs: 14 }"
    :label-col="{ lg: 6, md: 6, xs: 6 }"
    :label-warp="true"
    @finish="fnFinish"
  >
    <a-row>
      <a-col :lg="8" :md="18" :xs="24" style="margin-bottom: 30px">
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
          name="phone"
          :rules="[
            {
              required: false,
              pattern: regExpMobile,
              message: '请输入正确手机号码',
            },
          ]"
        >
          <a-input
            v-model:value="stateForm.form.phone"
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
            :options="userSexOptions"
          >
          </a-select>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 12 }">
          <a-space :size="8">
            <a-button
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
        </a-form-item>
      </a-col>
      <a-col :lg="6" :md="4" :xs="24">
        <a-space direction="vertical" :size="16">
          <a-avatar
            shape="circle"
            :size="128"
            :src="userStore.getAvatar"
            :alt="userStore.userName"
          ></a-avatar>
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

<style lang="less" scoped></style>
