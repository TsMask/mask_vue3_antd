<script setup lang="ts">
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import type { FileType } from 'ant-design-vue/es/upload/interface';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';
const emit = defineEmits(['upload', 'close', 'update:open']);
const props = defineProps({
  /**窗口标题 */
  title: {
    type: String,
    default: '标题',
  },
  /**是否上传中 */
  loading: {
    type: Boolean,
    default: false,
  },
  /**是否弹出显示，必传 */
  open: {
    type: Boolean,
    required: true,
  },
  /**允许上传的文件拓展类型，默认任意，可指定['.xls', '.xlsx'] */
  ext: {
    type: Array<string>,
    default: [],
  },
  /**上传文件大小（单位MB），默认不限制，可指定10 */
  size: {
    type: Number,
    default: 0,
  },
});

/**弹框关闭事件 */
function fnModalClose() {
  if (props.loading) return;
  emit('close');
}

/**上传前检查或转换压缩 */
function fnBeforeUpload(file: FileType) {
  if (props.loading) return false;
  // 检查文件大小
  if (props.size > 0) {
    const fileSize = file.size;
    const isLtM = fileSize / 1024 / 1024 < props.size;
    if (!isLtM) {
      message.error(`上传文件大小必须小于 ${props.size}MB`, 3);
      return false;
    }
  }
  // 检查后缀
  if (props.ext.length > 0) {
    const fileName = file.name;
    const isAllowType = props.ext.some(v => fileName.endsWith(v));
    if (!isAllowType) {
      message.error(`只支持上传文件格式 ${props.ext.join('、')}`, 3);
      return false;
    }
  }
  return true;
}

/**上传请求发出 */
function fnUpload(up: UploadRequestOption) {
  emit('upload', up.file);
}
</script>

<template>
  <ProModal
    :drag="true"
    :title="props.title"
    :open="props.open"
    :keyboard="false"
    :mask-closable="false"
    :confirm-loading="props.loading"
    :footer="null"
    @cancel="fnModalClose"
  >
    <a-space :size="8" direction="vertical" style="width: 100%">
      <a-upload-dragger
        :disabled="props.loading"
        :accept="props.ext.join(',')"
        name="file"
        :max-count="1"
        :show-upload-list="false"
        :before-upload="fnBeforeUpload"
        :custom-request="fnUpload"
      >
        <p class="ant-upload-drag-icon"><InboxOutlined /></p>
        <p class="ant-upload-text">点击选择或将文件拖入边框区域进行上传</p>
        <p class="ant-upload-hint">
          <template v-if="props.size > 0">
            允许上传文件大小 {{ props.size }} MB <br/>
          </template>
          <template v-if="props.ext.length > 0">
            允许导入
            {{ props.ext.join('、') }}
            格式文件
          </template>
        </p>
      </a-upload-dragger>
      <slot></slot>
    </a-space>
  </ProModal>
</template>

<style lang="less" scoped></style>
