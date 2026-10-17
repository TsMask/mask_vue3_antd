<script setup lang="ts">
import { toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'antdv-next';
import { addPost, getPost, updatePost } from '@/api/system/post';
import { parseDateToStr } from '@/utils/date';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
  },
});

/** 每次打开弹窗都返回新对象，避免上次表单残留引用 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    post_code: '',
    post_name: '',
    post_sort: 0,
    post_status: '0',
    remark: undefined as string | undefined,
    create_time: 0,
  };
}

const { modal, formCtl, rules, isView, openModal, closeModal } = useModalForm({
  formName: 'formCtlByPostEdit',
  initForm: createDefaultForm,
  rules: {
    post_code: [{ required: true, min: 1, max: 50, message: '请输入岗位编码' }],
    post_name: [{ required: true, min: 1, max: 50, message: '请输入岗位名称' }],
    post_sort: [{ required: true, message: '请输入岗位排序' }],
  },
});

const { executeAction, loading: submitting } = useModalAction();

function openView(id: string | number) {
  openModal({
    mode: 'view',
    title: '岗位信息',
    fetchDetail: () => getPost(id),
    errorMessage: '获取岗位信息失败',
  });
}

function openEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改岗位',
          fetchDetail: () => getPost(id),
          errorMessage: '获取岗位信息失败',
        }
      : {
          mode: 'add',
          title: '添加岗位',
        }
  );
}

/** 校验通过后按是否已有 id 区分新增和修改 */
async function handleSubmit() {
  try {
    await formCtl.validate();
  } catch (error: any) {
    message.error({
      content: `请正确填写 ${error.errorFields.length} 处必填信息！`,
      duration: 3,
    });
    return;
  }

  const form = toRaw(modal.form);
  await executeAction({
    action: () => (form.id ? updatePost(form) : addPost(form)),
    successText: '操作成功',
    onSuccess: () => {
      closeModal();
      emit('success');
    },
  });
}

defineExpose({ openView, openEdit });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnHidden="true"
    :width="800"
    :keyboard="!isView"
    :mask-closable="isView"
    :open="modal.visible"
    :title="modal.title"
    :confirm-loading="submitting"
    :footer="isView ? null : undefined"
    @ok="handleSubmit"
    @cancel="closeModal"
  >
    <a-form
      name="formCtlByPostEdit"
      :model="modal.form"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-row v-if="isView">
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="岗位编号" name="id">
            {{ modal.form.id }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="创建时间" name="create_time">
            <span v-if="+modal.form.create_time > 0">
              {{ parseDateToStr(+modal.form.create_time) }}
            </span>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="岗位编码"
            name="post_code"
            v-bind="formCtl.validateInfos.post_code"
          >
            <a-input
              v-model:value="modal.form.post_code"
              allow-clear
              placeholder="请输入岗位编码"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="岗位状态" name="post_status">
            <a-select
              v-model:value="modal.form.post_status"
              default-value="0"
              placeholder="岗位状态"
              :options="dict.sysNormalDisable"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="岗位名称"
            name="post_name"
            v-bind="formCtl.validateInfos.post_name"
          >
            <a-input
              v-model:value="modal.form.post_name"
              allow-clear
              placeholder="请输入岗位名称"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="岗位顺序" name="post_sort">
            <a-input-number
              v-model:value="modal.form.post_sort"
              :min="0"
              :max="9999"
              :step="1"
              placeholder="排序值"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="岗位说明"
        name="remark"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="!isView"
          placeholder="请输入岗位说明"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
