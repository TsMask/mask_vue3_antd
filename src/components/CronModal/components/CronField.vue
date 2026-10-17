<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import {
  cronFieldConfigs,
  formatCronField,
  getCronFieldOptions,
  parseCronField,
  type CronFieldKey,
  type CronFieldMode,
} from '../cron';

const props = defineProps<{
  field: CronFieldKey;
  value: string;
}>();

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const config = computed(() => cronFieldConfigs[props.field]);
const options = computed(() => getCronFieldOptions(props.field));
const state = reactive(
  parseCronField(props.field, props.value) ?? {
    mode: 'every' as CronFieldMode,
    intervalStart: cronFieldConfigs[props.field].min,
    interval: cronFieldConfigs[props.field].step,
    rangeStart: cronFieldConfigs[props.field].min,
    rangeEnd: cronFieldConfigs[props.field].max,
    specific: [String(cronFieldConfigs[props.field].min)],
  }
);

let applyingPropValue = false;
watch(
  () => props.value,
  value => {
    const parsedState = parseCronField(props.field, value);
    if (!parsedState) return;

    applyingPropValue = true;
    Object.assign(state, parsedState);
    applyingPropValue = false;
  }
);

watch(
  state,
  () => {
    if (applyingPropValue) return;
    emit('update:value', formatCronField(props.field, state));
  },
  { deep: true, flush: 'sync' }
);

function chooseMode(mode: CronFieldMode) {
  state.mode = mode;
}
</script>

<template>
  <a-radio-group v-model:value="state.mode" size="small">
    <a-space orientation="vertical" :size="14">
      <a-radio value="every">每{{ config.unit }}</a-radio>
      <a-radio v-if="config.linked" value="unspecified">不指定</a-radio>
      <a-radio value="interval">
        从
        <a-input-number
          v-model:value="state.intervalStart"
          size="small"
          :min="config.min"
          :max="config.max"
          :precision="0"
          :placeholder="`${config.min}-${config.max}`"
          @focus="chooseMode('interval')"
        />
        {{ config.unit }}开始，每隔
        <a-input-number
          v-model:value="state.interval"
          size="small"
          :min="1"
          :max="config.max"
          :precision="0"
          :placeholder="`1-${config.max}`"
          @focus="chooseMode('interval')"
        />
        {{ config.unit }}执行一次
      </a-radio>
      <a-radio value="range">
        周期从
        <a-input-number
          v-model:value="state.rangeStart"
          size="small"
          :min="config.min"
          :max="config.max"
          :precision="0"
          :placeholder="`${config.min}-${config.max}`"
          @focus="chooseMode('range')"
        />
        到
        <a-input-number
          v-model:value="state.rangeEnd"
          size="small"
          :min="config.min"
          :max="config.max"
          :precision="0"
          :placeholder="`${config.min}-${config.max}`"
          @focus="chooseMode('range')"
        />
        {{ config.unit }}
      </a-radio>
      <a-radio value="specific">指定{{ config.title }}(可多选)</a-radio>
      <a-select
        v-model:value="state.specific"
        size="small"
        mode="multiple"
        style="width: 100%"
        :placeholder="`指定${config.title}(可多选)`"
        :options="options"
        @mousedown="chooseMode('specific')"
        @focus="chooseMode('specific')"
      />
    </a-space>
  </a-radio-group>
</template>

<style scoped></style>
