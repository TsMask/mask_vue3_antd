<script setup lang="ts">
import { ref } from 'vue';
import type { TabsProps } from 'antdv-next';

type TechnologyItem = {
  id: string;
  title: string;
  description: string;
};

const emit = defineEmits<{ refresh: [] }>();

const activeKey = ref<'list' | 'empty'>('list');
const profileTabs: TabsProps['items'] = [
  { key: 'list', label: '列表' },
  { key: 'empty', label: '空状态' },
];

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
      tab-placement="top"
      :destroy-on-hidden="true"
      :items="profileTabs"
    >
      <template #contentRender="{ item }">
        <a-flex v-if="item.key === 'list'" vertical :gap="16">
          <a-flex
            v-for="technology in technologyItems"
            :key="technology.id"
            :gap="12"
            align="flex-start"
          >
            <a-avatar>{{ technology.id }}</a-avatar>
            <a-flex vertical :gap="4">
              <a-typography-text strong>
                {{ technology.title }}
              </a-typography-text>
              <a-typography-text type="secondary">
                {{ technology.description }}
              </a-typography-text>
            </a-flex>
          </a-flex>
        </a-flex>
        <a-empty v-else>
          <template #description>暂无数据，尝试刷新看看</template>
          <a-button type="primary" @click="emit('refresh')">刷新</a-button>
        </a-empty>
      </template>
    </a-tabs>
  </a-card>
</template>
