<script setup lang="ts">
import { ref } from 'vue';

type TechnologyItem = {
  id: string;
  title: string;
  description: string;
};

const emit = defineEmits<{ refresh: [] }>();

const activeKey = ref('list');

const technologyItems: TechnologyItem[] = [
  {
    id: 'Vue',
    title: 'Vue.js - 渐进式 JavaScript 框架 | Vue.js',
    description:
      '基于标准 HTML、CSS 和 JavaScript 构建，提供容易上手的 API 和一流的文档。性能出色，经过编译器优化、完全响应式的渲染系统，几乎不需要手动优化。',
  },
  {
    id: 'Vue Router',
    title: 'Vue Router | Vue.js 的官方路由',
    description:
      '为 Vue.js 提供富有表现力、可配置的、方便的路由，用直观且强大的语法来定义静态或动态路由。',
  },
  {
    id: 'Pinia',
    title: 'Pinia | The intuitive store for Vue.js',
    description:
      'Pinia hooks into Vue devtools to give you an enhanced development experience in both Vue 2 and Vue 3.',
  },
  {
    id: 'Vite',
    title: 'Vite | 下一代的前端工具链',
    description: 'Vite 是一种新型前端构建工具，能够显著提升前端开发体验。',
  },
];
</script>

<template>
  <a-card>
    <a-tabs
      v-model:activeKey="activeKey"
      tab-position="top"
      :destroy-inactive-tab-pane="true"
    >
      <a-tab-pane key="list" tab="列表">
        <a-list
          item-layout="horizontal"
          :data-source="technologyItems"
          row-key="id"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  {{ item.title }}
                </template>
                <template #description>
                  {{ item.description }}
                </template>
                <template #avatar>
                  <a-avatar>{{ item.id }}</a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </a-tab-pane>

      <a-tab-pane key="empty" tab="空状态">
        <a-empty>
          <template #description>暂无数据，尝试刷新看看</template>
          <a-button type="primary" @click="emit('refresh')">刷新</a-button>
        </a-empty>
      </a-tab-pane>
    </a-tabs>
  </a-card>
</template>
