<template>
  <span
    v-if="item.elTagType == 'default' || item.elTagType == ''"
    :class="item.elTagClass"
  >
    {{ item.label }}
  </span>
  <a-tag
    v-else
    :class="item.elTagClass"
    :type="item.elTagType === 'primary' ? '' : item.elTagType"
    color="purple"
  >
    {{ item.label }}
  </a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// pink red orange green cyan blue purple
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

const item = computed(() => {
  if (Array.isArray(props.options) && props.options.length > 0) {
    const option = props.options.find(
      item => Reflect.get(item as object[], props.valueField) === props.value
    );
    return option as Record<string, string>;
  }
  return {};
});
</script>

<style lang="less" scoped></style>
