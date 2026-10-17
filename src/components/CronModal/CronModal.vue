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

type CronTabItem = {
  key: CronFieldKey;
  label: string;
};

const cronTabs: CronTabItem[] = cronFields.map(field => ({
  key: field.key,
  label: field.title,
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
    destroy-on-hidden
    title="Cron表达式生成"
    :open="props.open"
    :ok-button-props="{ disabled: cronInvalid }"
    @cancel="cancelCronModal"
    @ok="confirmCronModal"
  >
    <a-tabs
      v-model:active-key="activeKey"
      tab-placement="top"
      type="line"
      :items="cronTabs"
    >
      <template #contentRender="{ item }">
        <CronField
          :field="item.key"
          :value="cronParts[item.key]"
          @update:value="updateCronPart(item.key, $event)"
        />
      </template>
    </a-tabs>

    <a-space-compact block class="result-box">
      <a-button disabled>表达式预览：</a-button>
      <a-input
        v-model:value="cronText"
        placeholder="请输入或生成cron表达式"
        style="flex: 1; min-width: 0"
      />
    </a-space-compact>

    <a-alert
      v-if="cronInvalid"
      type="error"
      show-icon
      message="Cron表达式不正确"
      description="请输入6位秒级表达式，例如：0/20 * * * * ?"
    />
  </a-modal>
</template>

<style scoped>
.result-box {
  margin-top: 14px;
  margin-bottom: 14px;
}
</style>
