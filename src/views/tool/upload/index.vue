<script lang="ts" setup>
import { reactive } from 'vue';
import { PageContainer } from '@ant-design-vue/pro-layout';
import { Modal } from 'ant-design-vue/lib/components';
import message from 'ant-design-vue/lib/message';
import { FileType, UploadFile } from 'ant-design-vue/lib/upload/interface';
import { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';
import saveAs from 'file-saver';
import {
  downloadFile,
  downloadFileChunk,
  uploadFile,
  uploadFileChunk,
} from '@/api/tool/file';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';

let state = reactive<{
  /**上传状态 */
  loading: boolean;
  uploadFilePath: string;
  downloadFilePath: string;
  /*文件列表 */
  fileList: UploadFile<any>[];
}>({
  loading: false,
  uploadFilePath: '',
  downloadFilePath: '',
  fileList: [
    // {
    //   uid: '1',
    //   percent: 100,
    //   status: 'success',
    //   name: 'xxx.png',
    //   url: '/upload/default/2023/06/xxx.png',
    //   thumbUrl: '/upload/default/2023/06/xxx.png',
    // },
  ],
});

/**下载文件 */
function fnDownload() {
  const key = 'downloadFile';
  message.loading({ content: '请稍等...', key });
  const filePath = state.downloadFilePath;
  if (!filePath) return;
  downloadFile(filePath).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({
        content: `已完成下载`,
        key,
        duration: 2,
      });
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      saveAs(res.data, fileName);
    } else {
      message.error({
        content: `${res.msg}`,
        key,
        duration: 2,
      });
    }
  });
}

/**下载切片文件 */
function fnDownloadChunk() {
  const key = 'downloadFileChunk';
  message.loading({ content: '请稍等...', key });
  const filePath = state.downloadFilePath;
  downloadFileChunk(filePath, 5).then(blob => {
    console.log(blob);
    if (blob.size === 0) {
      message.error({
        content: `文件读取失败`,
        key,
        duration: 2,
      });
    } else {
      message.success({
        content: `已完成下载`,
        key,
        duration: 2,
      });
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      saveAs(blob, fileName);
    }
  });
}

/**上传前检查或转换压缩 */
function fnBeforeUpload(file: FileType) {
  if (state.loading) return false;
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

/**上传文件 */
function fnUpload(up: UploadRequestOption) {
  Modal.confirm({
    title: '提示',
    content: `确认要上传文件吗?`,
    onOk() {
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      state.loading = true;
      let formData = new FormData();
      formData.append('file', up.file);
      formData.append('subPath', 'default');
      uploadFile(formData).then(res => {
        state.loading = false;
        hide();
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success('文件上传成功', 3);
          state.uploadFilePath = res.data.url;
          state.downloadFilePath = res.data.fileName;
        } else {
          message.error(res.msg, 3);
        }
      });
    },
  });
}

/**上传分片 */
function fnUploadChunk(up: UploadRequestOption) {
  const fileData = up.file as File;
  const item = state.fileList.find(f => f.name === fileData.name);
  Modal.confirm({
    title: '提示',
    content: `确认要上传文件吗?`,
    onOk() {
      // 发送请求
      const hide = message.loading('请稍等...', 0);
      uploadFileChunk(fileData, 4, 'default').then(res => {
        hide();
        if (res.code === RESULT_CODE_SUCCESS) {
          message.success('文件上传成功', 3);
          if (item) {
            item.url = res.data.url;
            item.name = res.data.newFileName;
            item.percent = 100;
            item.status = 'done';
          }
        } else {
          message.error(res.msg, 3);
          state.fileList.splice(state.fileList.length - 1, 1);
        }
      });
    },
    onCancel() {
      if (item) {
        state.fileList.splice(state.fileList.length - 1, 1);
      }
    },
  });
}
</script>

<template>
  <PageContainer title="上传示例">
    <a-row :gutter="16">
      <a-col :lg="12" :md="12" :xs="24">
        <a-card title="普通文件" style="margin-bottom: 16px">
          <a-row :gutter="8">
            <a-col :span="24" style="margin-bottom: 16px">
              <a-input
                style="margin-bottom: 16px"
                type="text"
                placeholder="输入资源文件地址"
                v-model:value="state.downloadFilePath"
              >
                <template #suffix>
                  <a-button type="primary" @click="fnDownload">
                    普通下载
                  </a-button>
                </template>
              </a-input>
              <a-input
                type="text"
                placeholder="输入资源文件地址"
                v-model:value="state.downloadFilePath"
              >
                <template #suffix>
                  <a-button type="primary" @click="fnDownloadChunk">
                    分片下载
                  </a-button>
                </template>
              </a-input>
            </a-col>
            <a-col :span="24">
              <a-space direction="vertical" :size="16">
                <a-upload
                  name="file"
                  list-type="picture"
                  :max-count="1"
                  :show-upload-list="false"
                  :before-upload="fnBeforeUpload"
                  :custom-request="fnUpload"
                >
                  <a-button type="default" :loading="state.loading">
                    选择文件
                  </a-button>
                </a-upload>
                <a-image
                  :width="128"
                  :height="128"
                  :src="state.uploadFilePath"
                />
              </a-space>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
      <a-col :lg="12" :md="12" :xs="24">
        <a-card title="大文件分片上传" style="margin-bottom: 16px">
          <a-upload
            v-model:file-list="state.fileList"
            name="file"
            list-type="picture"
            :custom-request="fnUploadChunk"
          >
            <a-button> 选择文件 </a-button>
          </a-upload>
        </a-card>
      </a-col>
    </a-row>
  </PageContainer>
</template>

<style lang="less" scoped></style>
