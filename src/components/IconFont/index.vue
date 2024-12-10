<script lang="ts" setup>
import { scriptUrl } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { createFromIconfontCN } from '@ant-design/icons-vue';
import { createVNode, isVNode } from 'vue';

const props = defineProps({
  type: {
    type: [String, Object],
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

// 动态生成图标组件
const renderIcon = () => {
  if (isVNode(props.type)) {
    return props.type;
  }
  if (props.type !== '#') {
    return createVNode(IconFont, {
      type: props.type,
      style: { fontSize: `${props.size}px` },
    });
  }
  return null; // 如果没有传入有效的 type，则返回 null
};
</script>

<template>
  <component :is="renderIcon()" />
</template>

<style lang="less" scoped></style>
