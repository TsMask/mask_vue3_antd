<script lang="ts" setup>
import { computed, onMounted, reactive, ref, toRaw } from 'vue';
import { Modal, message } from 'ant-design-vue';
import type { FileType } from 'ant-design-vue/es/upload/interface';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';
import { uploadFile } from '@/api/tool/file';
import { updateUserProfile } from '@/api/profile';
import { useDictSetup } from '@/hooks/useDictSetup';
import { isSuccess } from '@/plugins/http-fetch';
import useUserStore from '@/store/modules/user';
import { regExpEmail, regExpMobile, regExpNick } from '@/utils/regular-utils';

const userStore = useUserStore();
const { dict } = useDictSetup({
  keyMap: { sysUserGender: 'sys_user_gender' },
});

const fallbackUserGenderOptions: DictType[] = [
  { label: '未选择', value: '0' },
  { label: '男', value: '1' },
  { label: '女', value: '2' },
];

/** 性别字典请求失败时保留固定选项，避免个人资料无法提交 */
const userGenderOptions = computed(() =>
  dict.sysUserGender.length ? dict.sysUserGender : fallbackUserGenderOptions
);

const form = reactive({
  user_nick: '',
  user_email: '',
  user_phone: '',
  user_gender: undefined as string | undefined,
  user_avatar: '',
});
const submitting = ref(false);
const uploading = ref(false);

function handleResetForm() {
  Object.assign(form, userStore.getBaseInfo);
}

function showRequestError(error: any) {
  message.error({
    content: error?.message || '请求失败，请稍后重试',
    duration: 3,
  });
}

function handleSubmit() {
  Modal.confirm({
    title: '提示',
    content: '确认要提交修改用户基本信息吗？',
    onOk: () => submitBaseInfo().catch(showRequestError),
  });
}

/** 提交基础资料，成功后同步用户 Store，保证顶栏等展示立即更新 */
async function submitBaseInfo() {
  const hide = message.loading('请稍等...', 0);
  submitting.value = true;
  try {
    const requestForm = { ...toRaw(form) };
    const res = await updateUserProfile(requestForm);
    if (!isSuccess(res)) {
      message.error({
        content: res.msg || '用户基本信息修改失败',
        duration: 3,
      });
      return;
    }

    Modal.success({
      title: '提示',
      content: '用户基本信息修改成功！',
      okText: '我知道了',
      onOk() {
        userStore.setBaseInfo(requestForm);
      },
    });
  } finally {
    hide();
    submitting.value = false;
  }
}

/** 头像只允许 jpg/png 且小于 2MB，同时避免基础资料和头像并发提交 */
function validateBeforeUpload(file: FileType) {
  if (uploading.value) return false;

  const isImage = ['image/jpeg', 'image/png'].includes(file.type);
  if (!isImage) {
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

  return isImage && isLt2M;
}

function handleUpload(options: UploadRequestOption) {
  Modal.confirm({
    title: '提示',
    content: '确认要上传或变更用户头像吗？',
    onOk: () => submitAvatar(options).catch(showRequestError),
  });
}

/** 先上传头像文件，再保存返回的文件地址；只有两步都成功才更新本地头像 */
async function submitAvatar(options: UploadRequestOption) {
  const hide = message.loading('请稍等...', 0);
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', options.file);
    formData.append('subPath', 'avatar');

    const uploadRes = await uploadFile(formData);
    const filePath = uploadRes.data?.file_path;
    if (!isSuccess(uploadRes) || !filePath) {
      message.error({
        content: uploadRes.msg || '上传接口未返回文件地址',
        duration: 3,
      });
      return;
    }

    const requestForm = { ...toRaw(form), user_avatar: filePath };
    const res = await updateUserProfile(requestForm);
    if (!isSuccess(res)) {
      message.error({
        content: res.msg || '头像变更失败',
        duration: 3,
      });
      return;
    }

    form.user_avatar = filePath;
    userStore.setAvatar(filePath);
    message.success({
      content: '头像变更成功！',
      duration: 3,
    });
  } finally {
    hide();
    uploading.value = false;
  }
}

onMounted(handleResetForm);
</script>

<template>
  <a-form
    :model="form"
    name="AccountBaseInfoForm"
    :wrapper-col="{ lg: 16, md: 16, xs: 16 }"
    :label-col="{ lg: 6, md: 6, xs: 6 }"
    :label-wrap="true"
    @finish="handleSubmit"
  >
    <a-row :gutter="[16, 16]">
      <a-col :lg="6" :md="6" :xs="24">
        <a-space direction="vertical" :size="16">
          <a-avatar
            shape="circle"
            :size="128"
            :src="userStore.getAvatar"
            :alt="userStore.user_name"
          />
          <span>请选择等比大小图片作为头像，如 200x200、400x400</span>
          <a-upload
            name="file"
            list-type="picture"
            :max-count="1"
            :show-upload-list="false"
            :before-upload="validateBeforeUpload"
            :custom-request="handleUpload"
          >
            <a-button
              type="default"
              :loading="uploading"
              :disabled="submitting"
            >
              上传/变更图片
            </a-button>
          </a-upload>
        </a-space>
      </a-col>

      <a-col :lg="8" :md="18" :xs="24">
        <a-form-item
          label="用户昵称"
          name="user_nick"
          :rules="[
            {
              required: true,
              pattern: regExpNick,
              message: '昵称只能包含字母、数字、中文和下划线，且不少于2位',
            },
          ]"
        >
          <a-input
            v-model:value="form.user_nick"
            allow-clear
            :maxlength="26"
            placeholder="请输入用户昵称"
          />
        </a-form-item>

        <a-form-item
          label="手机号码"
          name="user_phone"
          :rules="[
            {
              required: false,
              pattern: regExpMobile,
              message: '请输入正确手机号码',
            },
          ]"
        >
          <a-input
            v-model:value="form.user_phone"
            allow-clear
            :maxlength="11"
            placeholder="请输入手机号码"
          />
        </a-form-item>

        <a-form-item
          label="电子邮箱"
          name="user_email"
          :rules="[
            {
              required: false,
              pattern: regExpEmail,
              message: '请输入正确电子邮箱',
            },
          ]"
        >
          <a-input
            v-model:value="form.user_email"
            allow-clear
            :maxlength="40"
            placeholder="请输入电子邮箱"
          />
        </a-form-item>

        <a-form-item
          label="用户性别"
          name="user_gender"
          :rules="[{ required: true, message: '请选择用户性别' }]"
        >
          <a-select
            v-model:value="form.user_gender"
            placeholder="用户性别"
            :options="userGenderOptions"
          />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 12 }">
          <a-space :size="8">
            <a-button type="primary" html-type="submit" :loading="submitting">
              确认修改
            </a-button>
            <a-button
              type="default"
              :disabled="submitting"
              @click="handleResetForm"
            >
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>
