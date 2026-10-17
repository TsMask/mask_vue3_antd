<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'antdv-next';
import defaultPreview from '@/assets/logo.png';
import { uploadFile } from '@/api/tool/file';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{
  success: [fileInfo: { url: string; filePath: string }];
}>();

const previewPath = ref(defaultPreview);
const { confirmAction, loading: uploading } = useModalAction();

/** 小文件示例仅允许 jpg/png，且上传前限制并发 */
function handleBeforeUpload(file: File) {
  if (uploading.value) return false;

  const isImage = ['image/jpeg', 'image/png'].includes(file.type);
  if (!isImage) {
    message.error({ content: '只支持上传图片格式（jpg、png）', duration: 3 });
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error({ content: '图片文件大小必须小于 2MB', duration: 3 });
  }

  return isImage && isLt2M;
}

/** 普通上传成功后立即预览，并向父页面传递可下载路径 */
function handleUpload(up: any) {
  const formData = new FormData();
  formData.append('file', up.file as File);
  formData.append('subPath', 'default');

  confirmAction({
    content: '确认要上传文件吗?',
    action: () => uploadFile(formData),
    successText: '文件上传成功！',
    onSuccess: res => {
      previewPath.value = res.data.url;
      emit('success', {
        url: res.data.url,
        filePath: res.data.file_path,
      });
    },
  });
}
</script>

<template>
  <a-card title="小文件普通上传" style="margin-bottom: 16px">
    <a-space orientation="vertical" :size="16">
      <a-upload
        name="file"
        list-type="picture"
        :max-count="1"
        :show-upload-list="false"
        :before-upload="handleBeforeUpload"
        :custom-request="handleUpload"
      >
        <a-button type="default" :loading="uploading"> 选择文件 </a-button>
      </a-upload>
      <a-image :width="128" :height="128" :src="previewPath" />
    </a-space>
  </a-card>
</template>
