<script setup lang="ts">
import { toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'antdv-next';
import {
  addDictType,
  getDictType,
  updateDictType,
} from '@/api/system/dict/type';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

/** 每次打开弹窗都返回新对象，避免上次表单残留引用 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    dict_name: '',
    dict_type: undefined as string | undefined,
    dict_status: '0',
    remark: undefined as string | undefined,
  };
}

const { modal, formCtl, rules, isView, openModal, closeModal } = useModalForm({
  formName: 'formCtlByDictTypeEdit',
  initForm: createDefaultForm,
  rules: {
    dict_name: [{ required: true, min: 1, max: 50, message: '请输入字典名称' }],
    dict_type: [{ required: true, min: 1, max: 50, message: '请输入字典类型' }],
  },
});

const { executeAction, loading: submitting } = useModalAction();

function openView(id: string | number) {
  openModal({
    mode: 'view',
    title: '字典类型信息',
    fetchDetail: () => getDictType(id),
    errorMessage: '获取字典类型信息失败',
  });
}

function openEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改字典类型',
          fetchDetail: () => getDictType(id),
          errorMessage: '获取字典类型信息失败',
        }
      : {
          mode: 'add',
          title: '添加字典类型',
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
    action: () => (form.id ? updateDictType(form) : addDictType(form)),
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
      name="formCtlByDictTypeEdit"
      :model="modal.form"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 4 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-form-item v-if="isView" label="字典编号" name="id">
        {{ modal.form.id }}
      </a-form-item>
      <a-form-item
        label="字典名称"
        name="dict_name"
        v-bind="formCtl.validateInfos.dict_name"
      >
        <a-input
          v-model:value="modal.form.dict_name"
          allow-clear
          placeholder="请输入字典名称"
          :maxlength="50"
        />
      </a-form-item>
      <a-form-item
        label="字典类型"
        name="dict_type"
        v-bind="formCtl.validateInfos.dict_type"
      >
        <a-input
          v-model:value="modal.form.dict_type"
          allow-clear
          placeholder="请输入字典类型"
          :maxlength="50"
        />
      </a-form-item>
      <a-form-item label="字典状态" name="dict_status">
        <a-select
          v-model:value="modal.form.dict_status"
          default-value="0"
          placeholder="字典状态"
          :options="dict.sysNormalDisable"
        />
      </a-form-item>
      <a-form-item label="字典说明" name="remark">
        <a-textarea
          v-model:value="modal.form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="!isView"
          placeholder="请输入字典说明"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
