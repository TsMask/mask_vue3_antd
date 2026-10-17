<script setup lang="ts">
import { toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'antdv-next';
import { addConfig, getConfig, updateConfig } from '@/api/system/config';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysConfigGroup: 'sys_config_group',
    configValueType: 'sys_config_value_type',
  },
});

/** 每次打开弹窗都返回新对象，避免上次表单残留引用 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    config_name: '',
    config_key: '',
    config_value: '',
    config_value_type: 'string',
    config_group: '',
    config_sort: 0,
    config_status: '1',
    remark: undefined as string | undefined,
  };
}

const { modal, formCtl, rules, isView, openModal, closeModal } = useModalForm({
  formName: 'formCtlByConfigEdit',
  initForm: createDefaultForm,
  rules: {
    config_name: [
      { required: true, min: 1, max: 50, message: '请输入参数名称' },
    ],
    config_key: [
      { required: true, min: 1, max: 50, message: '请输入参数键名' },
    ],
    config_value: [
      { required: true, min: 1, max: 50, message: '请输入参数键值' },
    ],
  },
});

const { executeAction, loading: submitting } = useModalAction();

function openView(id: string | number) {
  openModal({
    mode: 'view',
    title: '参数配置信息',
    fetchDetail: () => getConfig(id),
  });
}

function openEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改参数配置',
          fetchDetail: () => getConfig(id),
        }
      : {
          mode: 'add',
          title: '添加参数配置',
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
    action: () => (form.id ? updateConfig(form) : addConfig(form)),
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
      name="formCtlByConfigEdit"
      :model="modal.form"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="参数名称"
            name="config_name"
            v-bind="formCtl.validateInfos.config_name"
          >
            <a-input
              v-model:value="modal.form.config_name"
              allow-clear
              placeholder="请输入参数名称"
              :maxlength="45"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="参数组" name="config_group">
            <a-select
              v-model:value="modal.form.config_group"
              allow-clear
              placeholder="请选择参数组"
              :options="dict.sysConfigGroup"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="状态" name="config_status">
            <a-select
              v-model:value="modal.form.config_status"
              default-value="1"
              placeholder="状态"
              :options="dict.sysNormalDisable"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="排序" name="config_sort">
            <a-input-number
              v-model:value="modal.form.config_sort"
              :min="0"
              :max="9999"
              :step="1"
              placeholder="排序值"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="参数键名"
            name="config_key"
            v-bind="formCtl.validateInfos.config_key"
          >
            <a-input
              v-model:value="modal.form.config_key"
              allow-clear
              placeholder="请输入参数键名"
              :maxlength="45"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="键值类型" name="config_value_type">
            <a-select
              v-model:value="modal.form.config_value_type"
              default-value="string"
              placeholder="键值类型"
              :options="dict.configValueType"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="参数键值"
        name="config_value"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.config_value"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="512"
          :show-count="!isView"
          placeholder="请输入参数键值"
        />
      </a-form-item>
      <a-form-item
        label="参数说明"
        name="remark"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="!isView"
          placeholder="请输入参数说明"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
