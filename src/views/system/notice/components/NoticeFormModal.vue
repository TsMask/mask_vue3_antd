<script setup lang="ts">
import { computed, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'antdv-next';
import { addNotice, getNotice, updateNotice } from '@/api/system/notice';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const NOTICE_STATUS_DELETED = '3';

const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: {
    sysNoticeType: 'sys_notice_type',
    sysNoticeStatus: 'sys_notice_status',
  },
});

/** 已删除只用于列表/详情展示，编辑表单只提供可恢复状态 */
const editableNoticeStatusOptions = computed(() =>
  dict.sysNoticeStatus.filter(option => option.value !== NOTICE_STATUS_DELETED)
);

/** 每次打开弹窗都返回新对象，避免上次表单残留引用 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    notice_title: '',
    notice_content: '',
    notice_type: '2',
    notice_status: '1' as string | undefined,
    delFlag: '0',
    remark: '',
    create_by: undefined as string | undefined,
    create_time: undefined as number | undefined,
    update_by: undefined as string | undefined,
    update_time: undefined as number | undefined,
  };
}

const { modal, formCtl, rules, isView, openModal, closeModal } = useModalForm({
  formName: 'formCtlByNoticeEdit',
  initForm: createDefaultForm,
  rules: {
    notice_title: [
      { required: true, min: 2, max: 50, message: '请输入公告标题' },
    ],
    notice_type: [{ required: true, message: '请选择公告类型' }],
    notice_status: [{ required: true, message: '请选择公告状态' }],
    notice_content: [
      {
        required: true,
        min: 2,
        max: 3000,
        message: '请输入公告内容，长度2-3000个字符',
      },
    ],
  },
});

const { executeAction, loading: submitting } = useModalAction();

function openView(id: string | number) {
  openModal({
    mode: 'view',
    title: '公告信息',
    fetchDetail: () => getNotice(id),
    errorMessage: '获取公告信息失败',
  });
}

function openEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改公告',
          fetchDetail: () => getNotice(id),
          transformDetail: data =>
            data.notice_status === NOTICE_STATUS_DELETED
              ? { ...data, notice_status: undefined }
              : data,
          errorMessage: '获取公告信息失败',
        }
      : {
          mode: 'add',
          title: '添加公告',
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
    action: () => (form.id ? updateNotice(form) : addNotice(form)),
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
      name="formCtlByNoticeEdit"
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
            label="公告类型"
            name="notice_type"
            v-bind="formCtl.validateInfos.notice_type"
          >
            <a-select
              v-model:value="modal.form.notice_type"
              placeholder="公告类型"
              :options="dict.sysNoticeType"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="公告状态" name="notice_status">
            <a-select
              v-model:value="modal.form.notice_status"
              placeholder="公告状态"
              :options="isView ? dict.sysNoticeStatus : editableNoticeStatusOptions"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="公告标题"
        name="notice_title"
        v-bind="formCtl.validateInfos.notice_title"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-input
          v-model:value="modal.form.notice_title"
          allow-clear
          placeholder="请输入公告标题"
          :maxlength="50"
        />
      </a-form-item>
      <a-form-item
        label="公告内容"
        name="notice_content"
        v-bind="formCtl.validateInfos.notice_content"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.notice_content"
          :auto-size="{ minRows: 4, maxRows: 14 }"
          :maxlength="3000"
          :show-count="!isView"
          placeholder="请输入公告内容"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
