<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import type { ColumnsType } from 'ant-design-vue/es/table';
import { getSystemInfo } from '@/api/monitor/system';
import { useDetailQuery } from '@/hooks/useDetailQuery';

const route = useRoute();
/**路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/**磁盘信息表格字段列 */
let diskTableColumns: ColumnsType = [
  {
    title: '路径盘符',
    dataIndex: 'target',
    align: 'left',
  },
  {
    title: '总大小',
    dataIndex: 'size',
    align: 'left',
  },

  {
    title: '剩余大小',
    dataIndex: 'avail',
    align: 'left',
  },
  {
    title: '已使用大小',
    dataIndex: 'used',
    align: 'left',
  },
  {
    title: '空间使用率(%)',
    dataIndex: 'percent',
    align: 'left',
  },
];

/**数据参数类型 */
type ServerType = {
  /**CPU */
  cpu: Record<string, string | number>;
  /**磁盘 */
  disk: Record<string, string>[];
  /**内存 */
  memory: Record<string, string | number>;
  /**网络 */
  network: Record<string, string>;
  /**项目 */
  project: Record<string, string>;
  /**系统 */
  system: Record<string, string | number>;
  /**时间 */
  time: Record<string, string | number>;
};

let server: ServerType = reactive({
  cpu: {},
  disk: [],
  memory: {},
  network: {},
  project: {},
  system: {},
  time: {},
});

const { loading: loading, fetch: fetchServer } = useDetailQuery({
  queryFn: getSystemInfo,
});

/** 运行时长（秒）转换 */
function loadUpTime(uptime: string | number) {
  if (typeof uptime === 'string') return uptime;
  if (uptime <= 0) return '-';
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  const strArr: string[] = [];
  if (days !== 0) strArr.push(`${days}天`);
  if (hours !== 0) strArr.push(`${hours}小时`);
  if (minutes !== 0) strArr.push(`${minutes}分钟`);
  strArr.push(`${seconds}秒`);
  return strArr.join(' ');
}

onMounted(async () => {
  const data = await fetchServer();
  if (data) {
    // CPU信息
    const cpu = data.cpu;
    cpu.core_used = (cpu.core_used || []).map((item: string) => item).join(' / ');
    server.cpu = cpu;
    // 磁盘信息
    server.disk = data.disk;
    // 内存信息
    server.memory = data.memory;
    // 网络信息
    server.network = data.network;
    // 项目信息
    server.project = data.project;
    // 系统信息
    server.system = data.system;
    // 时间信息
    server.time = data.time;
  }
});
</script>

<template>
  <PageContainer :title="title" :loading="loading">
    <template #content>
      <a-typography-paragraph> 服务器与应用程序的信息 </a-typography-paragraph>
    </template>

    <a-card title="项目信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }" :bordered="true"
        :column="{ lg: 2, md: 2, xs: 1 }">
        <a-descriptions-item label="项目名称">
          {{ server.project.name }}
        </a-descriptions-item>
        <a-descriptions-item label="项目版本">
          {{ server.project.version }}
        </a-descriptions-item>

        <a-descriptions-item label="项目环境">
          {{ server.project.env }}
        </a-descriptions-item>
        <a-descriptions-item label="项目路径">
          {{ server.project.app_dir }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="系统信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }"
        :column="{ lg: 3, md: 3, xs: 1 }" :bordered="true">
        <a-descriptions-item label="系统平台">
          {{ server.system.platform }}
        </a-descriptions-item>
        <a-descriptions-item label="平台版本">
          {{ server.system.platform_version }}
        </a-descriptions-item>
        <a-descriptions-item label="系统OS">
          {{ server.system.os }}
        </a-descriptions-item>

        <a-descriptions-item label="系统架构">
          {{ server.system.arch }}
        </a-descriptions-item>
        <a-descriptions-item label="架构版本">
          {{ server.system.arch_version }}
        </a-descriptions-item>
        <a-descriptions-item label="系统运行">
          {{ loadUpTime(server.system.boot_time) }}
        </a-descriptions-item>

        <a-descriptions-item label="程序环境">
          {{ server.system.run_version }}
        </a-descriptions-item>
        <a-descriptions-item label="程序架构">
          {{ server.system.run_arch }}
        </a-descriptions-item>
        <a-descriptions-item label="程序运行">
          {{ loadUpTime(server.system.run_time) }}
        </a-descriptions-item>

        <a-descriptions-item label="主机名称">
          {{ server.system.hostname }}
        </a-descriptions-item>
        <a-descriptions-item label="主机用户目录">
          {{ server.system.home_dir }}
        </a-descriptions-item>
        <a-descriptions-item label="程序PID">
          {{ server.system.process_id }}
        </a-descriptions-item>

        <a-descriptions-item label="项目路径" :span="3">
          {{ server.system.cmd }}
        </a-descriptions-item>
        <a-descriptions-item label="执行命令" :span="3">
          {{ server.system.exec_command }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="CPU信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }" :column="1" :bordered="true">
        <a-descriptions-item label="型号">
          {{ server.cpu.model }}
        </a-descriptions-item>
        <a-descriptions-item label="速率Hz">
          {{ server.cpu.speed }}
        </a-descriptions-item>
        <a-descriptions-item label="核心数">
          {{ server.cpu.core }}
        </a-descriptions-item>
        <a-descriptions-item label="使用率(%)">
          {{ server.cpu.core_used }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="内存信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }"
        :column="{ lg: 2, md: 2, xs: 1 }" :bordered="true">
        <a-descriptions-item label="总内存">
          {{ server.memory.totalmem }}
        </a-descriptions-item>
        <a-descriptions-item label="剩余内存">
          {{ server.memory.freemem }}
        </a-descriptions-item>
        <a-descriptions-item label="使用率(%)">
          {{ server.memory.usage }}
        </a-descriptions-item>
        <a-descriptions-item label="进程总内存">
          {{ server.memory.rss }}
        </a-descriptions-item>
        <a-descriptions-item label="堆的总大小">
          {{ server.memory.heap_total }}
        </a-descriptions-item>
        <a-descriptions-item label="堆已分配">
          {{ server.memory.heap_used }}
        </a-descriptions-item>
        <a-descriptions-item label="链接库占用">
          {{ server.memory.external }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="时间信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }"
        :column="{ lg: 3, md: 3, xs: 1 }" :bordered="true">
        <a-descriptions-item label="时间">
          {{ server.time.current }}
        </a-descriptions-item>
        <a-descriptions-item label="时区">
          {{ server.time.timezone }}
        </a-descriptions-item>
        <a-descriptions-item label="时区名称">
          {{ server.time.timezone_name }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="网络信息" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
      <a-descriptions size="middle" layout="horizontal" :label-style="{ width: '140px' }" :column="1" :bordered="true">
        <a-descriptions-item :label="name" v-for="(value, name) in server.network" :key="name">
          {{ value }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="磁盘信息" :bordered="false" :body-style="{ padding: 0 }">
      <a-table class="disk" row-key="target" size="middle" :columns="diskTableColumns" :data-source="server.disk"
        :pagination="false" :scroll="{ x: true }">
      </a-table>
    </a-card>
  </PageContainer>
</template>

<style lang="less" scoped></style>
