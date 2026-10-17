<script setup lang="ts">
import { toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'antdv-next';
import {
  addDictData,
  getDictData,
  updateDictData,
} from '@/api/system/dict/data';
import { parseDateToStr } from '@/utils/date';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const props = defineProps<{
  dictTypeOptions: DictType[];
  lockedDictType: boolean;
}>();

const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

/** 每次打开弹窗都返回新对象，避免上次表单残留引用 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    dict_type: undefined as string | undefined,
    data_label: '',
    data_sort: 0,
    data_value: '',
    tag_class: '',
    tag_type: '',
    remark: '',
    data_status: '0',
    create_time: 0,
    create_by: undefined as string | undefined,
  };
}

const { modal, formCtl, rules, isView, openModal, closeModal } = useModalForm({
  formName: 'formCtlByDictDataEdit',
  initForm: createDefaultForm,
  rules: {
    dict_type: [{ required: true, message: '请选择字典类型' }],
    data_label: [
      { required: true, min: 1, max: 50, message: '请输入数据标签' },
    ],
    data_value: [
      { required: true, min: 1, max: 50, message: '请输入数据键值' },
    ],
  },
});

const { executeAction, loading: submitting } = useModalAction();

const tagTypeOptions: DictType[] = [
  { label: '普通文本', value: '' },
  { label: '默认（default）', value: 'default' },
  { label: '蓝色（blue）', value: 'blue' },
  { label: '青色（cyan）', value: 'cyan' },
  { label: '金色（gold）', value: 'gold' },
  { label: '绿色（green）', value: 'green' },
  { label: '亮绿（lime）', value: 'lime' },
  { label: '紫红（magenta）', value: 'magenta' },
  { label: '橙黄（orange）', value: 'orange' },
  { label: '粉色（pink）', value: 'pink' },
  { label: '紫色（purple）', value: 'purple' },
  { label: '红色（red）', value: 'red' },
  { label: '黄色（yellow）', value: 'yellow' },
  { label: '深蓝（geekblue）', value: 'geekblue' },
  { label: '棕色（volcano）', value: 'volcano' },
  { label: '进行（processing）', value: 'processing' },
  { label: '警告（warning）', value: 'warning' },
  { label: '错误（error）', value: 'error' },
  { label: '成功（success）', value: 'success' },
];

/** 将当前表单数据转成 DictTag 可用的单项选项，用于详情回显预览 */
function parseDataDict(data: Record<string, any>): DictType[] {
  return [
    {
      label: data.data_label,
      value: data.data_value,
      tag_class: data.tag_class,
      tag_type: data.tag_type,
    },
  ];
}

function openView(data: Record<string, any>) {
  openModal({
    mode: 'view',
    title: '字典数据信息',
    initialData: data,
  });
}

function openEdit(id?: string | number, defaultDictType?: string) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改字典数据',
          fetchDetail: () => getDictData(id),
          errorMessage: '获取字典数据信息失败',
        }
      : {
          mode: 'add',
          title: '添加字典数据',
          beforeOpen(form) {
            form.dict_type = defaultDictType;
          },
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
    action: () => (form.id ? updateDictData(form) : addDictData(form)),
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
      name="formCtlByDictDataEdit"
      :model="modal.form"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-row v-if="isView">
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="数据编号" name="id">
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
            label="字典类型"
            name="dict_type"
            v-bind="formCtl.validateInfos.dict_type"
          >
            <a-select
              v-model:value="modal.form.dict_type"
              placeholder="字典类型"
              :options="props.dictTypeOptions"
              :disabled="props.lockedDictType"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="数据状态" name="data_status">
            <a-select
              v-model:value="modal.form.data_status"
              default-value="0"
              placeholder="数据状态"
              :options="dict.sysNormalDisable"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="数据标签"
            name="data_label"
            v-bind="formCtl.validateInfos.data_label"
          >
            <a-input
              v-model:value="modal.form.data_label"
              allow-clear
              placeholder="请输入数据标签"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="数据键值"
            name="data_value"
            v-bind="formCtl.validateInfos.data_value"
          >
            <a-input
              v-model:value="modal.form.data_value"
              allow-clear
              placeholder="请输入数据键值"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="标签类型" name="tag_type">
            <a-select
              v-model:value="modal.form.tag_type"
              placeholder="标签类型"
              :options="tagTypeOptions"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="数据排序" name="data_sort">
            <a-input-number
              v-model:value="modal.form.data_sort"
              :min="0"
              :max="9999"
              :step="1"
              placeholder="请输入数据排序"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="样式属性"
        name="tag_class"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-input
          v-model:value="modal.form.tag_class"
          allow-clear
          placeholder="请输入样式属性"
          :maxlength="50"
        />
      </a-form-item>
      <a-form-item
        v-if="isView"
        label="回显预览"
        name="tag_type"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <DictTag
          :options="parseDataDict(modal.form)"
          :value="modal.form.data_value"
        />
      </a-form-item>
      <a-form-item
        label="数据说明"
        name="remark"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="!isView"
          placeholder="请输入数据说明"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
