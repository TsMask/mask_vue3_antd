<script setup lang="ts">
import { reactive, watch, onBeforeMount } from 'vue';
const emit = defineEmits(['update:value']);
const props = defineProps({
  value: {
    type: String,
    default: '*',
  },
});

/**指定列表初始数据 */
const optionsSpecific = Array.from({ length: 60 }, (_, i) => ({
  label: `${i}`.padStart(2, '0'),
  value: `${i}`,
}));

/**构建数据 */
let data = reactive({
  /**类型 */
  type: '1',
  /**间隔 */
  increment: 2,
  incrementStart: 0,
  /**周期 */
  rangeStart: 1,
  rangeEnd: 2,
  /**指定秒 */
  specific: ['0'],
});

/**监听数据，将数值格式化 */
watch(data, () => {
  let reultValue = '*';
  let val = data.type;
  // 每一
  if (val === '1') {
    reultValue = '*';
  }
  // 间隔
  if (val === '2') {
    let start = data.incrementStart;
    let increment = data.increment;
    reultValue = `${start ?? 0}/${increment ?? 0}`;
  }
  // 周期
  if (val === '3') {
    let start = data.rangeStart;
    let end = data.rangeEnd;
    reultValue = `${start ?? 0}-${end ?? 0}`;
  }
  // 指定
  if (val === '4') {
    reultValue = data.specific.sort((a, b) => +a - +b).join(',');
  }
  emit('update:value', reultValue);
});

/**挂载前初始属性 */
onBeforeMount(() => {
  const val = props.value;
  if (val === '*') {
    data.type = '1';
  }
  if (val.includes('/')) {
    const arr = val.split('/');
    data.incrementStart = Number(arr[0]);
    data.increment = Number(arr[1]);
    data.type = '2';
  }
  if (val.includes('-')) {
    const arr = val.split('-');
    data.rangeStart = Number(arr[0]);
    data.rangeEnd = Number(arr[1]);
    data.type = '3';
  }
  if (val.includes(',')) {
    data.specific = val.split(',').sort((a, b) => +a - +b);
    data.type = '4';
  }
});
</script>

<template>
  <a-radio-group size="small" v-model:value="data.type">
    <a-space direction="vertical" :size="18">
      <a-radio value="1">每一秒钟</a-radio>
      <a-radio value="2">
        每隔
        <a-input-number
          size="small"
          v-model:value="data.increment"
          :min="0"
          :max="59"
          placeholder="0-59"
        ></a-input-number>
        秒执行一次，从
        <a-input-number
          size="small"
          v-model:value="data.incrementStart"
          :min="0"
          :max="59"
          placeholder="0-59"
        ></a-input-number>
        秒开始
      </a-radio>
      <a-radio value="3">
        周期从
        <a-input-number
          size="small"
          v-model:value="data.rangeStart"
          :min="0"
          :max="59"
          placeholder="0-59"
        ></a-input-number>
        到
        <a-input-number
          size="small"
          v-model:value="data.rangeEnd"
          :min="0"
          :max="59"
          placeholder="0-59"
        ></a-input-number>
        秒
      </a-radio>
      <a-radio value="4">指定秒数(可多选)</a-radio>
      <a-select
        v-model:value="data.specific"
        size="small"
        mode="multiple"
        style="width: 100%"
        placeholder="指定秒数(可多选)"
        :options="optionsSpecific"
      ></a-select>
    </a-space>
  </a-radio-group>
</template>

<style lang="less" scoped></style>
