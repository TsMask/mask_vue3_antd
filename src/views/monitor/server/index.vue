<template>
  <page-container :title="route.meta.title">
    <template #content>
      <a-descriptions size="small" :column="2">
        <a-descriptions-item label="创建人">张三</a-descriptions-item>
        <a-descriptions-item label="联系方式">
          <a>421421</a>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">2017-01-10</a-descriptions-item>
        <a-descriptions-item label="更新时间">2017-10-10</a-descriptions-item>
        <a-descriptions-item label="备注"
          >中国浙江省杭州市西湖区古翠路</a-descriptions-item
        >
      </a-descriptions>
    </template>
    <template #extra>
      <a-button key="3">操作</a-button>
      <a-button key="2">操作</a-button>
      <a-button key="1" type="primary">主操作</a-button>
    </template>
    <template #extraContent>
      <a-space>
        <a-statistic title="Feedback" :value="1128">
          <template #prefix>
            <LikeOutlined />
          </template>
        </a-statistic>
        <a-statistic title="Unmerged" :value="93" suffix="/ 100" />
      </a-space>
    </template>

    <!-- 主内容区 -->
    <a-card title="Project Version" style="height: 120vh">
      {{ network }}
    </a-card>
  </page-container>
</template>

<script setup lang="ts">
import { getServer } from '@/api/monitor/server';
import { LikeOutlined } from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { ref } from 'vue';
const route = useRoute();

const network = ref('');
const server = ref([]);

function getList() {
  getServer().then(response => {
    server.value = response.data;
    // 服务IP
    const networkKeys = Object.keys(response.data.network).sort();
    const networkKey = networkKeys.length > 1 ? networkKeys[1] : networkKeys[0];
    network.value = response.data.network[networkKey];
  });
}

getList();
</script>
