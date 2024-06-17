<script setup lang="ts">
import { computed, PropType } from 'vue';
const props = defineProps({
  /**数据 */
  options: {
    type: Array as PropType<DictType[]>,
  },
  /**当前的值对应数据中的项字段 */
  valueField: {
    type: String as PropType<keyof DictType>,
    default: 'value',
  },
  /**当前值不存在时，从中选择数据默认值 */
  valueDefalut: {
    type: [Number, String],
    default: '',
  },
  /**当前的值 */
  value: {
    type: [Number, String],
    default: '',
  },
});

/**遍历找到对应值数据项 */
const item = computed(() => {
  if (Array.isArray(props.options) && props.options.length > 0) {
    let option = props.options.find(
      item => `${item[props.valueField]}` === `${props.value}`
    );
    // 数据默认值
    if (!option && props.valueDefalut) {
      option = props.options.find(
        item => `${item[props.valueField]}` === `${props.valueDefalut}`
      );
    }
    return option;
  }
  return undefined;
});
</script>

<template>
  <template v-if="item">
    <a-tag v-if="item.tagType" :class="item.tagClass" :color="item.tagType">
      {{ item.label }}
    </a-tag>
    <span v-else :class="item.tagClass">
      {{ item.label }}
    </span>
  </template>
  <span v-else></span>
</template>

<style scoped></style>
