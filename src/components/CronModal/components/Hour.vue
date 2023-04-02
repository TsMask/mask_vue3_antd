<script setup lang="ts">
import { reactive, computed, onBeforeMount } from 'vue';
const emit = defineEmits(['update:value']);
const props = defineProps({
  value: {
    type: String,
    default: '*',
  },
});

/**指定列表初始数据 */
const optionsSpecificSpecific = Array.from({ length: 24 }, (_, i) => ({
  label: `${i}`.padStart(2, '0'),
  value: i,
}));

/**数据 */
let data = reactive({
  type: '1',
  /**间隔 */
  incrementStart: 0,
  incrementIncrement: 2,
  /**周期 */
  rangeStart: 0,
  rangeEnd: 2,
  /**指定 */
  specificSpecific: [] as string[],
});

/**属性计算 */
const caleValue = computed(() => {
  // 每一
  if (data.type === '1') {
    return '*';
  }
  // 间隔
  if (data.type === '2') {
    let start = data.incrementStart;
    let increment = data.incrementIncrement;
    return `${start ?? 0}/${increment ?? 0}`;
  }
  // 周期
  if (data.type === '3') {
    let start = data.rangeStart;
    let end = data.rangeEnd;
    return `${start ?? 0}-${end ?? 0}`;
  }
  // 指定
  if (data.type === '4' && data.specificSpecific.length > 0) {
    return data.specificSpecific.sort((a, b) => +a - +b).join(',');
  }
  return '*';
});
emit('update:value', caleValue);

/**挂载前初始属性 */
onBeforeMount(() => {
  const value = props.value;
  if (value === '*') {
    data.type = '1';
  }
  if (value.includes('/')) {
    const arr = value.split('/');
    data.type = '2';
    data.incrementIncrement = Number(arr[0]);
    data.incrementStart = Number(arr[1]);
  }
  if (value.includes('-')) {
    const arr = value.split('-');
    data.type = '3';
    data.rangeStart = Number(arr[0]);
    data.rangeEnd = Number(arr[1]);
  }
  if (value.includes(',')) {
    data.type = '4';
    data.specificSpecific = value.split(',').sort((a, b) => +a - +b);
  }
});
</script>

<template>
  <a-radio-group size="small" v-model:value="data.type">
    <a-space direction="vertical" :size="18">
      <a-radio value="1">每一小时</a-radio>
      <a-radio value="2">
        从
        <a-input-number
          size="small"
          v-model:value="data.incrementStart"
          :min="0"
          :max="23"
          placeholder="0-23"
        ></a-input-number>
        时开始，每隔
        <a-input-number
          size="small"
          v-model:value="data.incrementIncrement"
          :min="0"
          :max="23"
          placeholder="0-23"
        ></a-input-number>
        小时执行一次
      </a-radio>
      <a-radio value="3">
        周期从
        <a-input-number
          size="small"
          v-model:value="data.rangeStart"
          :min="0"
          :max="23"
          placeholder="1-23"
        ></a-input-number>
        到
        <a-input-number
          size="small"
          v-model:value="data.rangeEnd"
          :min="0"
          :max="23"
          placeholder="0-23"
        ></a-input-number>
        小时
      </a-radio>
      <a-radio value="4">指定小时(可多选)</a-radio>
      <a-select
        v-model:value="data.specificSpecific"
        size="small"
        mode="multiple"
        style="width: 100%"
        placeholder="指定小时(可多选)"
        :options="optionsSpecificSpecific"
      ></a-select>
    </a-space>
  </a-radio-group>
</template>

<style lang="less" scoped></style>
