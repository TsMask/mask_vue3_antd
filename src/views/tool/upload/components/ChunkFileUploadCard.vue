<script setup lang="ts">
import { ref } from 'vue';
import type { UploadFile } from 'antdv-next';
import { uploadFileChunk } from '@/api/tool/file';
import { isSuccess } from '@/api/httpClient';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{
  success: [fileInfo: { url: string; filePath: string }];
}>();

const fileList = ref<UploadFile<any>[]>([]);
const { confirmAction, loading: uploading } = useModalAction();

/** 取消或失败时移除上传占位，避免列表停留在错误状态 */
function removeUploadItem(uid: string) {
  const index = fileList.value.findIndex(item => item.uid === uid);
  if (index >= 0) fileList.value.splice(index, 1);
}

/** 分片上传过程中持续回写整体进度，完成后把文件路径交给下载面板 */
function handleUpload(up: any) {
  const fileData = up.file as File & { uid: string };
  const uploadItem = fileList.value.find(item => item.uid === fileData.uid);
  if (!uploadItem) return;

  uploadItem.status = 'uploading';
  uploadItem.percent = 0;

  confirmAction({
    content: '确认要进行分片上传文件吗?',
    action: async () => {
      const res = await uploadFileChunk(fileData, 4, 'default', percent => {
        uploadItem.percent = percent;
      });
      if (!isSuccess(res)) uploadItem.status = 'error';
      return res;
    },
    successText: '文件上传成功！',
    onSuccess: res => {
      uploadItem.url = res.data.url;
      uploadItem.name = res.data.file_name;
      uploadItem.percent = 100;
      uploadItem.status = 'done';
      emit('success', {
        url: res.data.url,
        filePath: res.data.file_path,
      });
    },
    onError: () => {
      removeUploadItem(fileData.uid);
    },
    onCancel: () => {
      removeUploadItem(fileData.uid);
    },
  });
}
</script>

<template>
  <a-card title="大文件分片上传">
    <a-upload
      v-model:file-list="fileList"
      name="file"
      list-type="picture"
      :disabled="uploading"
      :custom-request="handleUpload"
    >
      <a-button :loading="uploading"> 选择文件 </a-button>
    </a-upload>
  </a-card>
</template>
