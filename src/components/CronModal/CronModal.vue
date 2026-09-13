<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import CronField from './components/CronField.vue';
import {
  DEFAULT_CRON,
  buildCronExpression,
  cronFieldConfigs,
  CRON_FIELD_KEYS,
  parseCronExpression,
  type CronFieldKey,
  type CronParts,
} from './cron';

const props = withDefaults(
  defineProps<{
    open: boolean;
    cron?: string;
  }>(),
  {
    cron: DEFAULT_CRON,
  }
);

const emit = defineEmits<{
  cancel: [];
  ok: [cron: string];
  'update:open': [open: boolean];
}>();

const activeKey = ref<CronFieldKey>('second');
const cronText = ref(DEFAULT_CRON);
const cronParts = reactive<CronParts>({
  second: '*',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
});

const cronInvalid = computed(() => !parseCronExpression(cronText.value));
const cronFields = CRON_FIELD_KEYS.map(field => ({
  key: field,
  ...cronFieldConfigs[field],
}));

function applyCronText(expression: string) {
  const parsedParts = parseCronExpression(expression);
  if (parsedParts) Object.assign(cronParts, parsedParts);
}

watch(cronText, applyCronText);

watch(
  () => props.open,
  open => {
    if (!open) return;
    cronText.value = props.cron.trim() || DEFAULT_CRON;
    applyCronText(cronText.value);
  }
);

function syncLinkedFields(field: CronFieldKey) {
  if (field !== 'day' && field !== 'week') return;

  if (cronParts.day === '?' && cronParts.week === '?') {
    cronParts[field === 'day' ? 'week' : 'day'] = '*';
    return;
  }

  if (cronParts.day !== '?' && cronParts.week !== '?') {
    cronParts[field === 'day' ? 'week' : 'day'] = '?';
  }
}

function updateCronPart(field: CronFieldKey, value: string) {
  cronParts[field] = value;
  syncLinkedFields(field);
  cronText.value = buildCronExpression(cronParts);
}

function closeCronModal() {
  emit('update:open', false);
}

function cancelCronModal() {
  closeCronModal();
  emit('cancel');
}

function confirmCronModal() {
  if (cronInvalid.value) return;
  closeCronModal();
  emit('ok', cronText.value.trim());
}
</script>

<template>
  <a-modal
    destroy-on-close
    title="Cron表达式生成"
    :open="props.open"
    :body-style="{ padding: '0 24px' }"
    :ok-button-props="{ disabled: cronInvalid }"
    @cancel="cancelCronModal"
    @ok="confirmCronModal"
  >
    <a-tabs v-model:active-key="activeKey" tab-position="top" type="line">
      <a-tab-pane
        v-for="field in cronFields"
        :key="field.key"
        :tab="field.title"
      >
        <CronField
          :field="field.key"
          :value="cronParts[field.key]"
          @update:value="updateCronPart(field.key, $event)"
        />
      </a-tab-pane>
    </a-tabs>

    <a-alert
      v-if="cronInvalid"
      class="cron-error"
      type="error"
      show-icon
      message="Cron表达式不正确"
      description="请输入6位秒级表达式，例如：0/20 * * * * ?。"
    />

    <a-input
      v-model:value="cronText"
      class="result-box"
      addon-before="表达式预览："
      placeholder="请输入或生成cron表达式"
    />
  </a-modal>
</template>

<style scoped>
.result-box {
  margin-top: 24px;
  margin-bottom: 24px;
}

.cron-error {
  margin-top: 24px;
}
</style>
