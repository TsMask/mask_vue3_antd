<script setup lang="ts">
defineProps<{
  loading: boolean;
  data: {
    cache_name: string;
    cache_key: string;
    cache_value: string;
    remark: string;
  };
}>();
</script>

<template>
  <a-card
    title="缓存内容"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
    :loading="loading"
  >
    <a-descriptions size="small" layout="vertical" :bordered="true" :column="1">
      <a-descriptions-item label="缓存名称">
        {{ data.cache_name }}
      </a-descriptions-item>
      <a-descriptions-item label="缓存键名">
        {{ data.cache_key }}
      </a-descriptions-item>
      <a-descriptions-item label="缓存内容">
        <a-typography-paragraph>
          <a-textarea
            :value="data.cache_value"
            :auto-size="{ minRows: 4, maxRows: 18 }"
            :maxlength="4000"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
            placeholder="显示缓存内容"
          />
        </a-typography-paragraph>
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
