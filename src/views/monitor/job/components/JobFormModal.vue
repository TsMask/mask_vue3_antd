<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import { addJob, getJob, updateJob } from '@/api/monitor/job';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const emit = defineEmits<{ success: [] }>();

const { dict } = useDictSetup({
  keyMap: {
    /** 任务组由系统字典维护 */
    sysJobGroup: 'sys_job_group',
    /** 任务状态 */
    jobStatus: [
      { label: '正常', value: '1' },
      { label: '暂停', value: '0' },
    ],
    /** 执行日志记录 */
    jobSaveLog: [
      { label: '记录', value: '1' },
      { label: '不记录', value: '0' },
    ],
    /** 错过后续触发时的补偿策略 */
    jobMisfirePolicy: [
      { label: '立即执行', value: '1' },
      { label: '执行一次', value: '2' },
      { label: '放弃执行', value: '3' },
    ],
    /** 是否允许同一任务并发执行 */
    jobConcurrent: [
      { label: '允许', value: '1' },
      { label: '禁止', value: '0' },
    ],
  },
});

const { modal, formCtl, isView, openModal, closeModal } = useModalForm({
  initForm: () => ({
    id: undefined as string | number | undefined,
    job_name: '',
    job_invoke_target: '',
    job_cron: '',
    job_misfire_policy: '3',
    job_concurrent: '0',
    job_group: 'DEFAULT',
    job_status: '0',
    job_save_log: '0',
    job_target_params: '',
    remark: '',
    status: '',
    create_time: 0,
  }),
  rules: {
    job_name: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入任务名称，限2-40个字符',
      },
    ],
    job_invoke_target: [
      {
        required: true,
        min: 2,
        max: 40,
        message: '请正确输入调用目标，限2-40个字符',
      },
    ],
    job_cron: [
      { required: true, min: 6, message: '请输入或生成cron执行表达式' },
    ],
  },
});

const cronVisible = ref(false);
const { executeAction, loading: submitting } = useModalAction();

function openView(id: string | number) {
  openModal({
    mode: 'view',
    title: '任务信息',
    fetchDetail: () => getJob(id),
  });
}

function openEdit(id?: string | number) {
  openModal(
    id
      ? {
          mode: 'edit',
          title: '修改任务',
          fetchDetail: () => getJob(id),
        }
      : {
          mode: 'add',
          title: '添加任务',
        }
  );
}

/** 关闭 Cron 生成器时，仅在有结果的情况下回填表达式 */
function handleCronConfirm(open: boolean, cron?: string) {
  cronVisible.value = open;
  if (cron) modal.form.job_cron = cron;
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
    action: () => (form.id ? updateJob(form) : addJob(form)),
    successText: '操作成功',
    onSuccess: () => {
      handleClose();
      emit('success');
    },
  });
}

/** 关闭表单时同步关闭 Cron 生成器，避免残留弹窗状态 */
function handleClose() {
  cronVisible.value = false;
  closeModal();
}

defineExpose({ openView, openEdit });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnClose="true"
    :width="800"
    :keyboard="!isView"
    :mask-closable="isView"
    :open="modal.visible"
    :title="modal.title"
    :confirm-loading="submitting"
    :footer="isView ? null : undefined"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form
      name="formCtlByJobEdit"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-row v-if="isView">
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
            label="任务名称"
            name="job_name"
            v-bind="formCtl.validateInfos.job_name"
          >
            <a-input
              v-model:value="modal.form.job_name"
              allow-clear
              placeholder="请输入任务名称"
              :maxlength="40"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="6" :md="6" :xs="24">
          <a-form-item label="出错策略" name="job_misfire_policy">
            <a-select
              :disabled="true"
              v-model:value="modal.form.job_misfire_policy"
              default-value="3"
              placeholder="出错策略"
              :options="dict.jobMisfirePolicy"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="6" :md="6" :xs="24">
          <a-form-item label="是否并发" name="job_concurrent">
            <a-select
              :disabled="true"
              v-model:value="modal.form.job_concurrent"
              default-value="0"
              placeholder="是否并发"
              :options="dict.jobConcurrent"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="调用目标"
            name="job_invoke_target"
            v-bind="formCtl.validateInfos.job_invoke_target"
          >
            <a-input
              v-model:value="modal.form.job_invoke_target"
              allow-clear
              placeholder="请输入调用目标"
              :maxlength="40"
            >
              <template #prefix>
                <a-tooltip placement="topLeft">
                  <template #title>
                    <div>
                      Processor调用示例：simple <br />
                      定义任务处理器示例：src\modules\monitor\processor <br />
                      参数说明：支持预设传入参数，在处理器中进行序列化处理参数
                    </div>
                  </template>
                  <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </a-tooltip>
              </template>
            </a-input>
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="任务组名" name="job_group">
            <a-select
              v-model:value="modal.form.job_group"
              default-value="DEFAULT"
              placeholder="任务组名"
              :options="dict.sysJobGroup"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="任务状态" name="job_status">
            <a-select
              v-model:value="modal.form.job_status"
              default-value="0"
              placeholder="任务状态"
              :options="dict.jobStatus"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="记录日志" name="job_save_log">
            <a-select
              v-model:value="modal.form.job_save_log"
              default-value="0"
              placeholder="记录日志"
              :options="dict.jobSaveLog"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="cron表达式"
        name="job_cron"
        v-bind="formCtl.validateInfos.job_cron"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-input
          v-model:value="modal.form.job_cron"
          allow-clear
          placeholder="请输入或生成cron执行表达式"
        >
          <template #prefix>
            <a-tooltip placement="topLeft">
              <template #title>
                <div>
                  表达式示例：0/20 * * * * ? <br />
                  示例说明：每20秒执行任务
                </div>
              </template>
              <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
            </a-tooltip>
          </template>
          <template #addonAfter>
            <a-button
              type="text"
              size="small"
              @click.prevent="handleCronConfirm(true)"
            >
              <template #icon>
                <FieldTimeOutlined />
              </template>
              生成表达式
            </a-button>
          </template>
        </a-input>
      </a-form-item>
      <a-form-item
        label="传入参数"
        name="job_target_params"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.job_target_params"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="480"
          placeholder="调用目标传入参数，仅支持json字符串"
        />
      </a-form-item>
      <a-form-item
        label="备注说明"
        name="remark"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="modal.form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="!isView"
          placeholder="可输入任务说明"
        />
      </a-form-item>
    </a-form>
  </ProModal>

  <CronModal
    v-model:open="cronVisible"
    :cron="modal.form.job_cron"
    @ok="handleCronConfirm(false, $event)"
  />
</template>
