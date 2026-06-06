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
import { PageContainer } from 'antdv-pro-layout';
import { getCache } from '@/api/monitor/cache';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDetailQuery } from '@/hooks/useDetailQuery';

const route = useRoute();

echarts.use([
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
]);

/**路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/**数据参数类型 */
type CacheType = {
  /**服务信息 */
  info: InfoType;
  /**当前连接可用键Key总数 */
  dbSize: number;
  /**命令状态 */
  commandStats: Record<string, string>[];
};

/**数据参数服务信息类型 */
type InfoType = {
  clients: Record<string, string>;
  cluster: Record<string, string>;
  cpu: Record<string, string>;
  errorstats: Record<string, string>;
  keyspace: Record<string, string>;
  memory: Record<string, string>;
  modules: Record<string, string>;
  persistence: Record<string, string>;
  replication: Record<string, string>;
  server: Record<string, string>;
  stats: Record<string, string>;
};

const { detail: cache, loading: loading, fetch: fetchCache } = useDetailQuery<CacheType>({
  queryFn: getCache,
});

/** 生成命令统计图 */
function commandStatsChart() {
  const commandStatsDom = document.getElementById('commandstats');
  if (!commandStatsDom || !cache.value) return;
  const commandStatsEchart = echarts.init(commandStatsDom);
  const option: echarts.ComposeOption<
    ToolboxComponentOption | TooltipComponentOption | LegendComponentOption | PieSeriesOption
  > = {
    // 鼠标悬浮提示
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    // 左侧标签
    legend: { orient: 'vertical', left: 'left' },
    // 右侧工具
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
        data: cache.value.commandStats,
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
  commandStatsEchart.setOption(option);
  window.addEventListener('resize', () => commandStatsEchart.resize());
}

onMounted(async () => {
  await fetchCache();
  commandStatsChart();
});
</script>

<template>
  <PageContainer :title="title" :loading="loading">
    <template #content>
      <a-typography-paragraph>
        缓存
        <a-typography-text code>Redis</a-typography-text>
        应用程序的信息
      </a-typography-paragraph>
    </template>

    <a-card v-if="cache" title="基本信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }" :bordered="true"
        :column="{ lg: 4, md: 2, xs: 1 }">
        <a-descriptions-item label="Redis版本">
          {{ cache.info.server.redis_version }}
        </a-descriptions-item>
        <a-descriptions-item label="运行模式">
          {{ cache.info.server.redis_mode == 'standalone' ? '单机' : '集群' }}
        </a-descriptions-item>
        <a-descriptions-item label="端口">
          {{ cache.info.server.tcp_port }}
        </a-descriptions-item>
        <a-descriptions-item label="客户端数">
          {{ cache.info.clients.connected_clients }}
        </a-descriptions-item>
        <a-descriptions-item label="运行时间(天)">
          {{ cache.info.server.uptime_in_days }}
        </a-descriptions-item>
        <a-descriptions-item label="使用内存">
          {{ cache.info.memory.used_memory_human }}
        </a-descriptions-item>
        <a-descriptions-item label="使用CPU">
          {{ parseFloat(cache.info.cpu.used_cpu_user_children).toFixed(2) }}
        </a-descriptions-item>
        <a-descriptions-item label="内存配置">
          {{ cache.info.memory.maxmemory_human }}
        </a-descriptions-item>
        <a-descriptions-item label="AOF是否开启">
          {{ cache.info.persistence.aof_enabled == '0' ? '否' : '是' }}
        </a-descriptions-item>
        <a-descriptions-item label="RDB是否成功">
          {{ cache.info.persistence.rdb_last_bgsave_status }}
        </a-descriptions-item>
        <a-descriptions-item label="Key数量">
          {{ cache.dbSize }}
        </a-descriptions-item>
        <a-descriptions-item label="网络入口/出口">
          {{ cache.info.stats.instantaneous_input_kbps }} kps /
          {{ cache.info.stats.instantaneous_output_kbps }} kps
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card v-if="cache" title="命令统计" :bordered="false">
      <div id="commandstats" style="height: 400px; width: 100%"></div>
    </a-card>
  </PageContainer>
</template>

<style lang="less" scoped></style>
