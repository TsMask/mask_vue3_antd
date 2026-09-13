<script setup lang="ts">
import { ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import ChunkFileUploadCard from './components/ChunkFileUploadCard.vue';
import FileDownloadCard from './components/FileDownloadCard.vue';
import SmallFileUploadCard from './components/SmallFileUploadCard.vue';

const downloadFilePath = ref('');

/** 上传成功后自动填充下载地址，贯通上传到下载示例流程 */
function handleUploadSuccess(fileInfo: { filePath: string }) {
  downloadFilePath.value = fileInfo.filePath;
}
</script>

<template>
  <PageContainer title="文件上传下载示例">
    <a-row :gutter="16">
      <a-col :lg="12" :md="12" :xs="24">
        <SmallFileUploadCard @success="handleUploadSuccess" />
        <ChunkFileUploadCard @success="handleUploadSuccess" />
      </a-col>
      <a-col :lg="12" :md="12" :xs="24">
        <FileDownloadCard v-model:file-path="downloadFilePath" />
      </a-col>
    </a-row>
  </PageContainer>
</template>
