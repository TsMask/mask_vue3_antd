<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const height = ref<string>(document.documentElement.clientHeight - 94.5 + 'px');
const props = defineProps({
  src: {
    type: String,
    required: true,
  },
});

let iframe = reactive({
  id: 'link',
  src: props.src,
});

onMounted(() => {
  if (route.name) {
    iframe.id = route.name.toString();
  }
  window.onresize = () => {
    height.value = document.documentElement.clientHeight - 94.5 + 'px;';
  };
});
</script>

<template>
  <div :style="'height:' + height">
    <iframe
      :id="iframe.id"
      :src="iframe.src"
      frameborder="no"
      style="width: 100%; height: 100%"
      scrolling="auto"
    ></iframe>
  </div>
</template>

<style lang="less" scoped></style>
