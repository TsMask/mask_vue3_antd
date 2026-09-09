<script setup lang="ts">
import { reactive } from 'vue';
import { message } from 'ant-design-vue';
import UploadModal from '@/components/UploadModal/index.vue';
import { importData, importTemplate } from '@/api/system/user';
import { uploadFile } from '@/api/tool/file';
import { saveAs } from 'file-saver';
import { isSuccess } from '@/plugins/http-fetch';

const emit = defineEmits<{ imported: [] }>();
const importState = reactive({
  open: false,
  loading: false,
  updateSupport: false,
  msg: '',
  templateDownload: false,
});

/** 每次打开导入弹窗都重置更新策略和上次导入结果 */
function open() {
  importState.updateSupport = false;
  importState.msg = '';
  importState.open = true;
}

function handleClose() {
  importState.open = false;
}

/** 导入分两步：先上传 CSV 拿路径，再把路径交给用户导入接口解析 */
async function handleFileUpload(file: File) {
  const hide = message.loading('正在上传并解析数据...', 0);
  importState.loading = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subPath', 'import');
    const uploadRes = await uploadFile(formData);
    if (!isSuccess(uploadRes)) {
      message.error(uploadRes.msg, 3);
      return;
    }
    const filePath = uploadRes.data.file_path;
    const importRes = await importData(filePath, importState.updateSupport);
    if (isSuccess(importRes)) {
      importState.msg = importRes.msg?.replaceAll(/<br\/>+/g, '\r');
      emit('imported');
    } else {
      message.error(importRes.msg, 3);
    }
  } finally {
    hide();
    importState.loading = false;
  }
}

/** 模板下载期间加锁，避免连续点击生成多个下载请求 */
async function handleDownloadTemplate() {
  if (importState.templateDownload) return;
  importState.templateDownload = true;
  try {
    const res = await importTemplate();
    if (isSuccess(res)) {
      saveAs(res.data, `user_template_${Date.now()}.csv`);
    }
  } finally {
    importState.templateDownload = false;
  }
}

defineExpose({ open });
</script>

<template>
  <UploadModal
    title="用户导入"
    :loading="importState.loading"
    :open="importState.open"
    :ext="['.csv']"
    :size="10"
    @upload="handleFileUpload"
    @close="handleClose"
  >
    <a-row justify="space-between" align="middle">
      <a-col :span="12">
        <a-checkbox
          :disabled="importState.loading"
          v-model:checked="importState.updateSupport"
        >
          是否更新已经存在的数据
        </a-checkbox>
      </a-col>
      <a-col :span="6">
        <a-button
          type="link"
          title="下载模板"
          @click.prevent="handleDownloadTemplate"
        >
          下载模板
        </a-button>
      </a-col>
    </a-row>
    <a-textarea
      :disabled="true"
      :hidden="!importState.msg"
      :value="importState.msg"
      :auto-size="{ minRows: 2, maxRows: 8 }"
    />
  </UploadModal>
</template>
