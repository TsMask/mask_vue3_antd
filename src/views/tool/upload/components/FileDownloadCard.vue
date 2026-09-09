<script setup lang="ts">
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';
import saveAs from 'file-saver';
import { downloadFile, downloadFileChunk } from '@/api/tool/file';
import { isSuccess } from '@/plugins/http-fetch';

const props = defineProps<{
  filePath: string;
}>();

const emit = defineEmits<{
  'update:filePath': [value: string];
}>();

const downloading = ref(false);
const progressText = ref('');
const downloadFilePath = computed({
  get: () => props.filePath,
  set: value => emit('update:filePath', value),
});

/** 从服务端文件路径截取文件名，作为浏览器保存文件名 */
function getFileName(filePath: string) {
  return filePath.substring(filePath.lastIndexOf('/') + 1) || 'download';
}

/** 按普通或分片方式下载，分片进度由请求回调持续更新 */
async function handleDownload(chunked: boolean) {
  if (!downloadFilePath.value) {
    message.warning({ content: '下载资源地址为空', duration: 3 });
    return;
  }

  downloading.value = true;
  progressText.value = chunked ? '准备分片下载...' : '';
  try {
    const request = chunked
      ? downloadFileChunk(downloadFilePath.value, 5, percent => {
          progressText.value = `分片下载进度：${percent}%`;
        })
      : downloadFile(downloadFilePath.value);
    const res = await request;

    if (isSuccess(res)) {
      message.success({ content: '已完成下载', duration: 3 });
      saveAs(res.data, getFileName(downloadFilePath.value));
    } else {
      message.error({ content: res.msg, duration: 3 });
    }
  } catch {
    message.error({ content: '下载失败', duration: 3 });
  } finally {
    downloading.value = false;
    progressText.value = '';
  }
}
</script>

<template>
  <a-card title="文件下载">
    <a-space direction="vertical" :size="12" style="width: 100%">
      <a-input
        v-model:value="downloadFilePath"
        type="text"
        placeholder="输入资源地址，列如：/upload/default/2024/12/xxx.png"
      >
        <template #suffix>
          <a-button
            type="primary"
            :loading="downloading"
            @click="handleDownload(false)"
          >
            普通下载
          </a-button>
        </template>
      </a-input>
      <a-input
        v-model:value="downloadFilePath"
        type="text"
        placeholder="输入资源地址，列如：/upload/default/2024/12/xxx.png"
      >
        <template #suffix>
          <a-button
            type="primary"
            :loading="downloading"
            @click="handleDownload(true)"
          >
            分片下载
          </a-button>
        </template>
      </a-input>
      <a-typography-text v-if="progressText" type="secondary">
        {{ progressText }}
      </a-typography-text>
    </a-space>
  </a-card>
</template>
