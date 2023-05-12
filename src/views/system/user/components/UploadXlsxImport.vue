<script setup lang="ts">
import { reactive } from 'vue';
import { message } from 'ant-design-vue/lib';
import { FileType } from 'ant-design-vue/lib/upload/interface';
import { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';
import { ResultType } from '@/plugins/http-fetch';
const emit = defineEmits(['close', 'update:visible']);
const props = defineProps({
  /**窗口标题 */
  title: {
    type: String,
    default: '标题',
  },
  /**是否弹出显示，必传 */
  visible: {
    type: Boolean,
    required: true,
  },
  /**文件上传函数方法，必传 */
  uploadFileMethod: {
    type: Function,
    required: true,
  },
  /**下载模板函数方法 */
  downloadTemplateMethod: {
    type: Function,
    default: undefined,
  },
  /**显示更新已存在数据勾选项 */
  showUpdateSupport: {
    type: Boolean,
    default: false,
  },
  /**允许上传的文件拓展类型，默认 xls、xlsx */
  fileExt: {
    type: Array<string>,
    default: ['xls', 'xlsx'],
  },
  /**上传文件大小（单位MB），默认 10 */
  fileSize: {
    type: Number,
    default: 10,
  },
});

/**上传状态 */
let updateState = reactive({
  /**是否更新已经存在的数据 */
  updateSupport: false,
  /**是否上传中 */
  loading: false,
  /**是否已上传文件 */
  isUpload: false,
  /**上传结果信息 */
  msg: '',
});

/**重置上传状态 */
function fnResetUpdateState() {
  updateState = Object.assign(updateState, {
    updateSupport: false,
    loading: false,
    isUpload: false,
    msg: '',
  });
}

/**上传前检查或转换压缩 */
function fnBeforeUpload(file: FileType) {
  if (updateState.loading) return false;
  const isAllowType = props.fileExt.some(v => file.name.endsWith(v));
  if (!isAllowType) {
    message.error(`只支持上传文件格式 ${props.fileExt.join('、')}`, 3);
  }
  const isLtM = file.size / 1024 / 1024 < props.fileSize;
  if (!isLtM) {
    message.error(`上传文件大小必须小于 ${props.fileSize}MB`, 3);
  }
  return isAllowType && isLtM;
}

/**上传请求发出 */
function fnUpload(up: UploadRequestOption) {
  if (typeof props.uploadFileMethod !== 'function') return;
  const hide = message.loading('请稍等...', 0);
  updateState.loading = true;
  let formData = new FormData();
  formData.append('file', up.file);
  formData.append('updateSupport', `${updateState.updateSupport}`);
  props.uploadFileMethod(formData).then((res: ResultType) => {
    hide();
    updateState.isUpload = true;
    updateState.loading = false;
    updateState.msg = res.msg?.replaceAll(/<br\/>+/g, '\r');
  });
}

/**弹框确认按钮事件 */
function fnModalOk() {
  emit('update:visible', false);
  emit('close', updateState.isUpload);
  fnResetUpdateState();
}

/**弹框取消按钮事件 */
function fnModalCancel() {
  emit('update:visible', false);
  emit('close', updateState.isUpload);
  fnResetUpdateState();
}
</script>

<template>
  <a-modal
    width="500px"
    :title="props.title"
    :visible="props.visible"
    :keyboard="false"
    :mask-closable="false"
    @ok="fnModalOk"
    @cancel="fnModalCancel"
  >
    <a-space :size="8" direction="vertical" style="width: 100%">
      <a-upload-dragger
        :disabled="updateState.loading"
        name="file"
        :max-count="1"
        :show-upload-list="false"
        :before-upload="fnBeforeUpload"
        :custom-request="fnUpload"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined></inbox-outlined>
        </p>
        <p class="ant-upload-text">点击选择或将文件拖入边框区域进行上传</p>
        <p class="ant-upload-hint">
          仅允许导入
          {{ props.fileExt.join('、') }}
          格式文件，上传文件大小
          {{ props.fileSize }}
          MB。
        </p>
      </a-upload-dragger>
      <a-row :gutter="18" justify="space-between" align="middle">
        <a-col :span="12">
          <a-checkbox
            v-model:checked="updateState.updateSupport"
            v-if="showUpdateSupport"
          >
            是否更新已经存在的数据
          </a-checkbox>
        </a-col>
        <a-col :span="6">
          <a-button
            type="link"
            title="下载模板"
            @click="downloadTemplateMethod()"
            v-if="downloadTemplateMethod"
          >
            下载模板
          </a-button>
        </a-col>
      </a-row>
      <a-textarea
        :disabled="true"
        :hidden="updateState.msg.length < 1"
        :value="updateState.msg"
        :auto-size="{ minRows: 2, maxRows: 8 }"
      />
    </a-space>
  </a-modal>
</template>

<style lang="less" scoped>
.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
