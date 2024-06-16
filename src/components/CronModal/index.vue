<template>
  <ProModal
    :drag="true"
    :destroyOnClose="true"
    title="Cron表达式生成"
    :visible="props.visible"
    :body-style="{ padding: '0 24px' }"
    @cancel="fnCronModal(false)"
    @ok="fnCronModal(true)"
  >
    <a-tabs tab-position="top" type="line">
      <a-tab-pane key="1" tab="秒">
        <CronSecond v-model:value="cronValue.second"></CronSecond>
      </a-tab-pane>
      <a-tab-pane key="2" tab="分钟">
        <CronMinute v-model:value="cronValue.minute"></CronMinute>
      </a-tab-pane>
      <a-tab-pane key="3" tab="小时">
        <CronHour v-model:value="cronValue.hour"></CronHour>
      </a-tab-pane>
      <a-tab-pane key="4" tab="日">
        <CronDay v-model:value="cronValue.day"></CronDay>
      </a-tab-pane>
      <a-tab-pane key="5" tab="月">
        <CronMonth v-model:value="cronValue.month"></CronMonth>
      </a-tab-pane>
    </a-tabs>

    <a-input
      class="reultBox"
      addon-before="表达式预览："
      v-model:value="cronStr"
      disabled
    />
  </ProModal>
</template>
<script lang="ts" setup>
import CronSecond from './components/Second.vue';
import CronMinute from './components/Minute.vue';
import CronHour from './components/Hour.vue';
import CronDay from './components/Day.vue';
import CronMonth from './components/Month.vue';
import { reactive, computed, watch } from 'vue';

const emit = defineEmits(['cancel', 'ok', 'update:visible']);
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  cron: {
    type: String,
    default: '* * * * * ?',
  },
});

/**cron属性值 */
let cronValue = reactive({
  second: '*',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
});

/**组合cron结果 */
const cronStr = computed(() => {
  let time = `${cronValue.second} ${cronValue.minute} ${cronValue.hour}`;
  let date = `${cronValue.day} ${cronValue.month} ${cronValue.week}`;
  return `${time} ${date}`;
});

/**监听是否显示，初始cron属性 */
watch(
  () => props.visible,
  val => {
    if (!val) return;
    const arr = props.cron.split(' ');
    // 6 位以上是合法表达式
    if (arr.length >= 6) {
      Object.assign(cronValue, {
        second: arr[0],
        minute: arr[1],
        hour: arr[2],
        day: arr[3],
        month: arr[4],
        week: arr[5],
      });
    }
  }
);

/**
 * 窗口事件
 * @param val modal触发事件
 */
function fnCronModal(val: boolean) {
  emit('update:visible', false);
  if (val) {
    emit('ok', cronStr.value);
  } else {
    emit('cancel');
  }
}
</script>

<style lang="less" scoped>
.reultBox {
  margin-top: 48px;
  margin-bottom: 24px;
}
</style>
