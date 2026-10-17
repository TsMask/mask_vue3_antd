<script setup lang="ts">
import * as echarts from 'echarts/core';
import {
  ToolboxComponent,
  ToolboxComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
} from 'echarts/components';
import { PieChart, PieSeriesOption } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  stats: Record<string, string>[];
}>();

echarts.use([
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
]);

const chartRef = ref<HTMLDivElement>();
let chart: ReturnType<typeof echarts.init> | undefined;

function handleResize() {
  chart?.resize();
}

/** 首次渲染时注册 resize 监听，后续仅更新配置以保留图表实例 */
function renderChart() {
  if (!chartRef.value || props.stats.length === 0) return;

  if (!chart) {
    chart = echarts.init(chartRef.value);
    window.addEventListener('resize', handleResize);
  }
  const option: echarts.ComposeOption<
    | ToolboxComponentOption
    | TooltipComponentOption
    | LegendComponentOption
    | PieSeriesOption
  > = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    toolbox: {
      show: true,
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: false },
        restore: { show: true },
        saveAsImage: { show: true },
      },
    },
    series: [
      {
        name: '命令',
        type: 'pie',
        radius: ['5%', '80%'],
        center: ['60%', '50%'],
        roseType: 'area',
        itemStyle: { borderRadius: 8 },
        data: props.stats,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
  chart.setOption(option);
}

watch(
  () => props.stats,
  stats => {
    if (stats.length === 0) return;
    void nextTick(renderChart);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
  chart = undefined;
});
</script>

<template>
  <a-card title="命令统计" variant="borderless">
    <div ref="chartRef" style="height: 400px; width: 100%"></div>
  </a-card>
</template>
