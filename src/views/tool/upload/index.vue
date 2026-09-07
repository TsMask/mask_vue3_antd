<script lang="ts" setup>
import { reactive } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { Modal, message } from 'ant-design-vue';
import type { FileType, UploadFile } from 'ant-design-vue/es/upload/interface';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';
import saveAs from 'file-saver';
import {
  downloadFile,
  downloadFileChunk,
  uploadFile,
  uploadFileChunk,
} from '@/api/tool/file';
import { isSuccess } from '@/plugins/http-fetch';

type StateType = {
  /** 上传状态 */
  loading: boolean;
  /** 上传资源地址 */
  uploadFilePath: string;
  /** 下载资源地址 */
  downloadFilePath: string;
  /** 文件列表 */
  fileList: UploadFile<any>[];
};

let state = reactive<StateType>({
  loading: false,
  uploadFilePath: '/src/assets/logo.png',
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

/** 下载文件（普通方式） */
function fnDownload() {
  const filePath = state.downloadFilePath;
  if (!filePath) {
    message.warning({ content: '下载资源地址为空', duration: 3 });
    return;
  }
  const hide = message.loading('请稍等..', 0);
  downloadFile(filePath)
    .then(res => {
      if (isSuccess(res)) {
        message.success({ content: '已完成下载', duration: 3 });
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        saveAs(res.data, fileName);
      } else {
        message.error({ content: res.msg, duration: 3 });
      }
    })
    .finally(() => {
      hide();
    });
}

/** 下载文件（分片方式，带进度） */
function fnDownloadChunk() {
  const filePath = state.downloadFilePath;
  if (!filePath) {
    message.warning({ content: '下载资源地址为空', duration: 3 });
    return;
  }
  const hide = message.loading('请稍等..', 0);
  downloadFileChunk(filePath, 5, percent => {
    console.log(`下载进度: ${percent}%`);
  })
    .then(res => {
      if (isSuccess(res)) {
        message.success({ content: '已完成下载', duration: 3 });
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        saveAs(res.data, fileName);
      } else {
        message.error({ content: res.msg, duration: 3 });
      }
    })
    .finally(() => {
      hide();
    });
}

/** 上传前检查或压缩 */
function fnBeforeUpload(file: FileType) {
  if (state.loading) return false;
  const isJpgOrPng = ['image/jpeg', 'image/png'].includes(file.type);
  if (!isJpgOrPng) {
    message.error({ content: '只支持上传图片格式（jpg、png）', duration: 3 });
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error({ content: '图片文件大小必须小于 2MB', duration: 3 });
  }
  return isJpgOrPng && isLt2M;
}

/** 上传文件（普通方式） */
function fnUpload(up: UploadRequestOption) {
  Modal.confirm({
    title: '提示',
    content: '确认要上传文件吗?',
    onOk() {
      const hide = message.loading('请稍等..', 0);
      state.loading = true;
      const formData = new FormData();
      formData.append('file', up.file);
      formData.append('subPath', 'default');
      uploadFile(formData)
        .then(res => {
          if (isSuccess(res)) {
            message.success({ content: '文件上传成功！', duration: 3 });
            state.uploadFilePath = res.data.url;
            state.downloadFilePath = res.data.file_path;
          } else {
            message.error(res.msg, 3);
          }
        })
        .finally(() => {
          hide();
          state.loading = false;
        });
    },
  });
}

/** 上传文件（分片方式，带进度） */
function fnUploadChunk(up: UploadRequestOption) {
  const fileData = up.file as File;
  const item = state.fileList.find(f => f.name === fileData.name);
  Modal.confirm({
    title: '提示',
    content: '确认要进行分片上传文件吗?',
    onOk() {
      const hide = message.loading('请稍等..', 0);
      uploadFileChunk(fileData, 4, 'default', percent => {
        console.log(`上传进度: ${percent}%`);
      })
        .then(res => {
          if (isSuccess(res)) {
            message.success({ content: '文件上传成功！', duration: 3 });
            if (item) {
              item.url = res.data.url;
              item.name = res.data.file_name;
              item.percent = 100;
              item.status = 'done';
              state.downloadFilePath = res.data.file_path;
            }
          } else {
            message.error(res.msg, 3);
            state.fileList.splice(state.fileList.length - 1, 1);
          }
        })
        .finally(() => {
          hide();
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
  <PageContainer title="文件上传下载示例">
    <a-row :gutter="16">
      <a-col :lg="12" :md="12" :xs="24">
        <a-card title="小文件普通上传" style="margin-bottom: 16px">
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
            <a-image :width="128" :height="128" :src="state.uploadFilePath" />
          </a-space>
        </a-card>
        <a-card title="大文件分片上传">
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
      <a-col :lg="12" :md="12" :xs="24">
        <a-card title="文件下载" style="margin-bottom: 16px">
          <a-row :gutter="8">
            <a-col :span="24" style="margin-bottom: 16px">
              <a-input
                style="margin-bottom: 16px"
                type="text"
                placeholder="输入资源地址，列如：/upload/default/2024/12/xxx.png"
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
                placeholder="输入资源地址，列如：/upload/default/2024/12/xxx.png"
                v-model:value="state.downloadFilePath"
              >
                <template #suffix>
                  <a-button type="primary" @click="fnDownloadChunk">
                    分片下载
                  </a-button>
                </template>
              </a-input>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>
  </PageContainer>
</template>

<style scoped></style>
