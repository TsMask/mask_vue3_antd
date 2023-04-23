<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps({
  /**数据 */
  options: {
    type: Array,
  },
  /**当前的值对应数据中的项字段 */
  valueField: {
    type: String,
    default: 'value',
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
    const option = (props.options as any[]).find(
      item => `${item[props.valueField]}` === `${props.value}`
    );
    return option;
  }
  return undefined;
});
</script>

<template>
  <template v-if="item">
    <a-tag
      v-if="item.elTagType"
      :class="item.elTagClass"
      :color="item.elTagType"
    >
      {{ item.label }}
    </a-tag>
    <span v-else :class="item.elTagClass">
      {{ item.label }}
    </span>
  </template>
  <span v-else></span>
</template>

<style lang="less" scoped></style>
