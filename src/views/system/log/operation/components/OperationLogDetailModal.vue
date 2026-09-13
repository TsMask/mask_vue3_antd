<script setup lang="ts">
import { ref } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { parseDateToStr } from '@/utils/date';
import { useDictSetup } from '@/hooks/useDictSetup';

const { dict } = useDictSetup({
  keyMap: {
    sysOperationType: 'sys_operation_type',
    sysSuccessFail: 'sys_success_fail',
  },
});

const visible = ref(false);
const detail = ref<Record<string, any>>({});

/** JSON 文本格式化后便于阅读，普通文本保持原样。 */
function formatJsonText(value?: string) {
  if (!value) return value;
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/** 打开详情前格式化参数和消息，便于排查长 JSON 请求 */
function openView(row: Record<string, any>) {
  detail.value = {
    ...row,
    operation_param: formatJsonText(row.operation_param),
    operation_msg: formatJsonText(row.operation_msg),
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
    title="操作日志信息"
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
          <a-form-item label="执行状态" name="operation_status">
            <DictTag
              :options="dict.sysSuccessFail"
              :value="detail.operation_status"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="业务类型" name="operation_type">
            {{ detail.title }} /
            <DictTag
              :options="dict.sysOperationType"
              :value="detail.operation_type"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="操作人员" name="create_by">
            {{ detail.create_by }} / {{ detail.operation_ip }} /
            {{ detail.operation_location }}
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="请求地址" name="operation_url">
            {{ detail.operation_method }}
            {{ detail.operation_url }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="操作时间" name="create_time">
            <span v-if="+detail.create_time > 0">
              {{ parseDateToStr(+detail.create_time) }}
            </span>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="请求耗时" name="operation_cost_time">
            {{ detail.operation_cost_time }} ms
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="操作方法" name="operation_function">
            {{ detail.operation_function }}
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="请求参数"
        name="operation_param"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="detail.operation_param"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          placeholder="请求参数"
          :disabled="true"
        />
      </a-form-item>
      <a-form-item
        label="操作信息"
        name="operation_msg"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-textarea
          v-model:value="detail.operation_msg"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          placeholder="操作信息"
          :disabled="true"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button key="cancel" @click="handleClose">关闭</a-button>
    </template>
  </ProModal>
</template>
