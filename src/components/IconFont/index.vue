<script lang="ts" setup>
import { scriptUrl } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { createFromIconfontCN } from '@ant-design/icons-vue';

const props = defineProps({
  type: {
    type: String,
    default: '#',
  },
  size: {
    type: Number,
    default: 14,
  },
});

/**字体图标加载为组件 */
const IconFont = createFromIconfontCN({
  scriptUrl: scriptUrl,
});
</script>

<template>
  <IconFont
    v-if="type != '#'"
    :type="props.type"
    :style="{ fontSize: size + 'px' }"
  ></IconFont>
</template>

<style lang="less" scoped></style>
