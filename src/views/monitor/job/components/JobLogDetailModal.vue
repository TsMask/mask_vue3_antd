<script setup lang="ts">
import { ref } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { parseDateToStr } from '@/utils/date-utils';
import { useDictSetup } from '@/hooks/useDictSetup';

const { dict } = useDictSetup({
  keyMap: {
    sysJobGroup: 'sys_job_group',
    sysSuccessFail: 'sys_success_fail',
  },
});

const visible = ref(false);
const detail = ref<Record<string, any>>({});

/** JSON 文本格式化后便于阅读，普通文本保持原样。 */
function formatJsonText(value?: string) {
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/** 打开详情前格式化 JSON 字段，便于阅读任务参数和执行消息 */
function openView(row: Record<string, any>) {
  detail.value = {
    ...row,
    job_target_params: formatJsonText(row.job_target_params),
    log_msg: formatJsonText(row.log_msg),
  };
  visible.value = true;
}

function handleClose() {
  visible.value = false;
}

defineExpose({ openView });
</script>

<template>
  <ProModal
    :drag="true"
    :width="800"
    :open="visible"
    title="调度日志信息"
    @cancel="handleClose"
  >
    <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="日志编号" name="id">
            {{ detail.id }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="执行状态" name="log_status">
            <DictTag
              :options="dict.sysSuccessFail"
              :value="detail.log_status"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="任务名称" name="job_name">
            {{ detail.job_name }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="任务组名" name="job_group">
            <DictTag :options="dict.sysJobGroup" :value="detail.job_group" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="调用目标" name="job_invoke_target">
            {{ detail.job_invoke_target }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="记录时间" name="create_time">
            <span v-if="+detail.create_time > 0">
              {{ parseDateToStr(+detail.create_time) }}
            </span>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="消耗时间" name="log_cost_time">
            {{ detail.log_cost_time ?? 0 }} ms
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="传入参数"
        name="job_target_params"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="detail.job_target_params"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :disabled="true"
          style="color: rgba(0, 0, 0, 0.85)"
        />
      </a-form-item>
      <a-form-item
        label="日志信息"
        name="log_msg"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="detail.log_msg"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :disabled="true"
          style="color: rgba(0, 0, 0, 0.85)"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button key="cancel" @click="handleClose">关闭</a-button>
    </template>
  </ProModal>
</template>
