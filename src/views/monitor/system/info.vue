<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import { PageContainer } from '@ant-design-vue/pro-layout';
import { ColumnsType } from 'ant-design-vue/lib/table';
import { getSystemInfo } from '@/api/monitor/system';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**加载状态 */
let loading = ref<boolean>(true);

/**磁盘信息表格字段列 */
let diskTableColumns: ColumnsType = [
  {
    title: '路径盘符',
    dataIndex: 'target',
    align: 'center',
  },
  {
    title: '总大小',
    dataIndex: 'size',
    align: 'center',
  },

  {
    title: '剩余大小',
    dataIndex: 'avail',
    align: 'center',
  },
  {
    title: '已使用大小',
    dataIndex: 'used',
    align: 'center',
  },
  {
    title: '空间使用率(%)',
    dataIndex: 'pcent',
    align: 'center',
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

onMounted(() => {
  getSystemInfo().then(res => {
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      // CPU信息
      let cpu = res.data.cpu;
      cpu.coreUsed = cpu.coreUsed.map((item: string) => item).join(' / ');
      server.cpu = cpu;
      // 磁盘信息
      server.disk = res.data.disk;
      // 内存信息
      server.memory = res.data.memory;
      // 网络信息
      server.network = res.data.network;
      // 项目信息
      server.project = res.data.project;
      // 系统信息
      server.system = res.data.system;
      // 时间信息
      server.time = res.data.time;
      // 加载状态
      loading.value = false;
    }
  });
});
</script>

<template>
  <PageContainer :title="title" :loading="loading">
    <template #content>
      <a-typography-paragraph> 服务器与应用程序的信息 </a-typography-paragraph>
    </template>

    <a-card
      title="项目信息"
      :bordered="false"
      :body-style="{ marginBottom: '24px', padding: 0 }"
    >
      <a-descriptions
        size="middle"
        layout="horizontal"
        :label-style="{ width: '140px' }"
        :bordered="true"
        :column="{ lg: 2, md: 2, xs: 1 }"
      >
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
          {{ server.project.appDir }}
        </a-descriptions-item>
        <a-descriptions-item label="项目依赖">
          <a-tag
            v-for="(value, name) in server.project.dependencies"
            :key="name"
          >
            {{ name }}:{{ value }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card
      title="系统信息"
      :bordered="false"
      :body-style="{ marginBottom: '24px', padding: 0 }"
    >
      <a-descriptions
        size="middle"
        layout="horizontal"
        :label-style="{ width: '140px' }"
        :column="{ lg: 2, md: 2, xs: 1 }"
        :bordered="true"
      >
        <a-descriptions-item
          label="GO版本"
          :span="2"
          v-if="server.system && server.system.go"
        >
          {{ server.system.go }}
        </a-descriptions-item>
        <a-descriptions-item
          label="Node版本"
          v-if="server.system && server.system.node"
        >
          {{ server.system.node }}
        </a-descriptions-item>
        <a-descriptions-item
          label="V8版本"
          v-if="server.system && server.system.v8"
        >
          {{ server.system.v8 }}
        </a-descriptions-item>
        <a-descriptions-item label="进程PID号">
          {{ server.system.processId }}
        </a-descriptions-item>
        <a-descriptions-item label="运行平台">
          {{ server.system.platform }}
        </a-descriptions-item>
        <a-descriptions-item label="系统架构">
          {{ server.system.arch }}
        </a-descriptions-item>
        <a-descriptions-item label="系统平台">
          {{ server.system.uname }}
        </a-descriptions-item>
        <a-descriptions-item label="系统发行版本">
          {{ server.system.release }}
        </a-descriptions-item>
        <a-descriptions-item label="主机名称">
          {{ server.system.hostname }}
        </a-descriptions-item>
        <a-descriptions-item label="主机用户目录" :span="2">
          {{ server.system.homeDir }}
        </a-descriptions-item>
        <a-descriptions-item label="项目路径" :span="2">
          {{ server.system.cmd }}
        </a-descriptions-item>
        <a-descriptions-item label="执行命令" :span="2">
          {{ server.system.execCommand }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card
      title="CPU信息"
      :bordered="false"
      :body-style="{ marginBottom: '24px', padding: 0 }"
    >
      <a-descriptions
        size="middle"
        layout="horizontal"
        :label-style="{ width: '140px' }"
        :column="1"
        :bordered="true"
      >
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
          {{ server.cpu.coreUsed }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card
      title="内存信息"
      :bordered="false"
      :body-style="{ marginBottom: '24px', padding: 0 }"
    >
      <a-descriptions
        size="middle"
        layout="horizontal"
        :label-style="{ width: '140px' }"
        :column="{ lg: 2, md: 2, xs: 1 }"
        :bordered="true"
      >
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
          {{ server.memory.heapTotal }}
        </a-descriptions-item>
        <a-descriptions-item label="堆已分配">
          {{ server.memory.heapUsed }}
        </a-descriptions-item>
        <a-descriptions-item label="链接库占用">
          {{ server.memory.external }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card
      title="时间信息"
      :bordered="false"
      :body-style="{ marginBottom: '24px', padding: 0 }"
    >
      <a-descriptions
        size="middle"
        layout="horizontal"
        :label-style="{ width: '140px' }"
        :column="{ lg: 2, md: 2, xs: 1 }"
        :bordered="true"
      >
        <a-descriptions-item label="时区">
          {{ server.time.timezone }}
        </a-descriptions-item>
        <a-descriptions-item label="时间">
          {{ server.time.current }}
        </a-descriptions-item>
        <a-descriptions-item label="时区名称">
          {{ server.time.timezoneName }}
        </a-descriptions-item>
        <a-descriptions-item label="程序启动时间">
          {{ server.time.uptime }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card
      title="网络信息"
      :bordered="false"
      :body-style="{ marginBottom: '24px', padding: 0 }"
    >
      <a-descriptions
        size="middle"
        layout="horizontal"
        :label-style="{ width: '140px' }"
        :column="1"
        :bordered="true"
      >
        <a-descriptions-item
          :label="name"
          v-for="(value, name) in server.network"
          :key="name"
        >
          {{ value }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="磁盘信息" :bordered="false" :body-style="{ padding: 0 }">
      <a-table
        class="disk"
        row-key="target"
        size="middle"
        :columns="diskTableColumns"
        :data-source="server.disk"
        :pagination="false"
        :scroll="{ x: true }"
      >
      </a-table>
    </a-card>
  </PageContainer>
</template>

<style lang="less" scoped></style>
