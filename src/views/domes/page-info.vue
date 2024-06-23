<template>
  <PageContainer :title="title">
    <template #content>
      <a-descriptions size="small" :column="2">
        <a-descriptions-item label="创建人">张三</a-descriptions-item>
        <a-descriptions-item label="联系方式">
          <a>15612341234</a>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">2021-01-10</a-descriptions-item>
        <a-descriptions-item label="更新时间">2024-03-03</a-descriptions-item>
        <a-descriptions-item label="备注">
          中国浙江省杭州市西湖区古翠路
        </a-descriptions-item>
      </a-descriptions>
    </template>
    <template #extra>
      <a-button key="3">操作</a-button>
      <a-button key="2">操作</a-button>
      <a-button key="1" type="primary">主操作</a-button>
    </template>
    <template #contentExtra>
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
    <div style="height: 120vh">
      <a-result
        status="404"
        title="Hello World"
        sub-title="Sorry, you are not authorized to access this page."
        class="result-box"
      >
        <template #extra>
          <a-button type="primary">Back Home</a-button>
        </template>
      </a-result>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { PageContainer } from "antdv-pro-layout";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { LikeOutlined } from "@ant-design/icons-vue";
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta?.title as any);
</script>

<style scoped lang="css">
.result-box {
  height: 100%;
  background: #ffffff;
}
[data-theme='dark'] .result-box {
  background: #141414;
}
</style>
