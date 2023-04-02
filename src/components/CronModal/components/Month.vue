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
const optionsSpecificSpecific = Array.from({ length: 12 }, (_, i) => {
  let idx = i + 1;
  return {
    label: idx,
    value: idx,
  };
});

/**构建数据 */
let data = reactive({
  /**类型 */
  type: '1',
  /**间隔 */
  incrementStart: 1,
  incrementIncrement: 1,
  /**周期 */
  rangeStart: 1,
  rangeEnd: 2,
  /**指定秒 */
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
    data.incrementStart = Number(arr[0]);
    data.incrementIncrement = Number(arr[1]);
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
      <a-radio value="1">每一月</a-radio>
      <a-radio value="2">
        从
        <a-input-number
          size="small"
          v-model:value="data.incrementStart"
          :min="1"
          :max="12"
          placeholder="1-12"
        ></a-input-number>
        月开始，每隔
        <a-input-number
          size="small"
          v-model:value="data.incrementIncrement"
          :min="1"
          :max="12"
          placeholder="1-12"
        ></a-input-number>
        月执行
      </a-radio>
      <a-radio value="3">
        周期从
        <a-input-number
          size="small"
          v-model:value="data.rangeStart"
          :min="1"
          :max="12"
          placeholder="1-12"
        ></a-input-number>
        到
        <a-input-number
          size="small"
          v-model:value="data.rangeEnd"
          :min="1"
          :max="12"
          placeholder="1-12"
        ></a-input-number>
        月之间的每个月
      </a-radio>
      <a-radio value="4">指定月(可多选)</a-radio>
      <a-select
        v-model:value="data.specificSpecific"
        size="small"
        mode="multiple"
        style="width: 100%"
        placeholder="指定月(可多选)"
        :options="optionsSpecificSpecific"
      ></a-select>
    </a-space>
  </a-radio-group>
</template>

<style lang="less" scoped></style>
