<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import CacheKeyTable from './components/CacheKeyTable.vue';
import CacheNameTable from './components/CacheNameTable.vue';
import CacheValuePanel from './components/CacheValuePanel.vue';
import {
  listCacheName,
  listCacheKey,
  getCacheValue,
  clearCacheName,
  clearCacheKey,
  clearCacheSafe,
} from '@/api/monitor/cache';
import useUserStore from '@/store/modules/user';
import { isSuccess } from '@/api/httpClient';
import { useModalAction } from '@/hooks/useModalAction';
import { useProTable } from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');
const userStore = useUserStore();

interface CacheValueRecord {
  cache_name: string;
  cache_key: string;
  cache_value: string;
  remark: string;
}

/** 初始化键值面板结构，保证后端缺省字段仍能稳定渲染 */
function createEmptyCacheValue(): CacheValueRecord {
  return {
    cache_name: '',
    cache_key: '',
    cache_value: '',
    remark: '',
  };
}

/** 当前选中的缓存名称，决定键名列表的数据来源。 */
const selectedCacheName = ref('');

const {
  dataSource: cacheNameData,
  loading: cacheNameLoading,
  reload: fetchCacheNames,
  rowSelection: cacheNameRowSelection,
  selectedRowKeys: selectedCacheNameKeys,
  removeSelectedRowKeys: removeSelectedCacheNameKeys,
} = useProTable({
  queryFn: listCacheName,
  defaultPageSize: 20,
  rowKey: 'cache_name',
  selection: {
    rowSelection: { type: 'radio' },
    onChange: keys =>
      handleSelectCacheName(keys[0] === undefined ? '' : String(keys[0])),
  },
});

const {
  dataSource: cacheKeyData,
  loading: cacheKeyLoading,
  reload: fetchCacheKeys,
  rowSelection: cacheKeyRowSelection,
  selectedRowKeys: selectedCacheKeyKeys,
  removeSelectedRowKeys: removeSelectedCacheKeyKeys,
} = useProTable({
  queryFn: params => listCacheKey(params.cache_name),
  params: () => ({ cache_name: selectedCacheName.value }),
  defaultPageSize: 20,
  manual: true,
  rowKey: 'cache_key',
  selection: {
    rowSelection: { type: 'radio' },
    onChange: keys =>
      handleSelectCacheKey(keys[0] === undefined ? '' : String(keys[0])),
  },
});

const cacheValueLoading = ref(false);
const cacheValue = ref<CacheValueRecord>(createEmptyCacheValue());
const { executeAction } = useModalAction();

function resetCacheValue() {
  cacheValue.value = createEmptyCacheValue();
}

/** 清空键列表时同步清掉键选中态和右侧内容，避免展示过期数据 */
function resetCacheKeys() {
  cacheKeyData.value = [];
  removeSelectedCacheKeyKeys(selectedCacheKeyKeys.value);
  resetCacheValue();
}

/** 切换缓存命名空间时重置下级列表，再按新命名空间加载键 */
function handleSelectCacheName(cacheName: string) {
  if (!cacheName) {
    selectedCacheName.value = '';
    removeSelectedCacheNameKeys(selectedCacheNameKeys.value);
    resetCacheKeys();
    return;
  }

  selectedCacheName.value = cacheName;
  resetCacheKeys();
  fetchCacheKeys();
}

function refreshCacheKeys() {
  if (!selectedCacheName.value) {
    resetCacheKeys();
    return;
  }
  fetchCacheKeys();
}

function handleRefreshCacheNames() {
  fetchCacheNames();
}

function handleRefreshKeys() {
  if (!selectedCacheName.value) {
    message.warning({ content: '请在缓存列表中选择数据项！', duration: 3 });
    return;
  }
  refreshCacheKeys();
}

/** JSON 内容格式化后便于阅读；普通文本保持原样。 */
function formatCacheValue(value: string) {
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/** 读取选中键的内容；空选择只清空面板，不发起查询 */
async function handleSelectCacheKey(cacheKey: string) {
  if (!cacheKey) {
    resetCacheValue();
    return;
  }
  if (!userStore.hasPermissions(['monitor:cache:query'])) return;

  cacheValueLoading.value = true;
  try {
    const res = await getCacheValue(selectedCacheName.value, cacheKey);
    if (isSuccess(res) && res.data) {
      cacheValue.value = {
        ...createEmptyCacheValue(),
        ...res.data,
        cache_value: formatCacheValue(res.data.cache_value ?? ''),
      };
    } else {
      message.error({ content: res.msg || '获取缓存内容失败', duration: 3 });
    }
  } catch {
    message.error({ content: '获取缓存内容失败', duration: 3 });
  } finally {
    cacheValueLoading.value = false;
  }
}

/** 只清理系统标记的安全缓存，并恢复三栏的初始选择状态 */
function handleClearSafe() {
  return executeAction({
    action: () => clearCacheSafe(),
    successText: '已完成安全清理缓存',
    onSuccess() {
      selectedCacheName.value = '';
      removeSelectedCacheNameKeys(selectedCacheNameKeys.value);
      resetCacheKeys();
      fetchCacheNames();
    },
  });
}

/** 清理指定缓存名，若正是当前选中项则同时收起下级数据 */
function handleClearName(cacheName: string) {
  return executeAction({
    action: () => clearCacheName(cacheName),
    successText: '缓存名称已清理',
    onSuccess() {
      if (selectedCacheName.value !== cacheName) return;

      selectedCacheName.value = '';
      removeSelectedCacheNameKeys([cacheName]);
      resetCacheKeys();
    },
  });
}

/** 删除单个键后刷新键列表，并避免右侧继续显示已删除内容 */
function handleClearKey(cacheKey: string) {
  return executeAction({
    action: () => clearCacheKey(selectedCacheName.value, cacheKey),
    successText: '缓存键名已删除',
    onSuccess() {
      removeSelectedCacheKeyKeys([cacheKey]);
      if (cacheValue.value.cache_key === cacheKey) {
        resetCacheValue();
      }
      refreshCacheKeys();
    },
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        系统在缓存
        <a-typography-text code>Redis</a-typography-text>
        应用程序中的可控的缓存信息
      </a-typography-paragraph>
    </template>

    <a-row :gutter="20">
      <a-col :lg="8" :md="8" :xs="24">
        <CacheNameTable
          :loading="cacheNameLoading"
          :data-source="cacheNameData"
          :row-selection="cacheNameRowSelection"
          @refresh="handleRefreshCacheNames"
          @clear-safe="handleClearSafe"
          @clear-name="handleClearName"
        />
      </a-col>

      <a-col :lg="8" :md="8" :xs="24">
        <CacheKeyTable
          :loading="cacheKeyLoading"
          :data-source="cacheKeyData"
          :row-selection="cacheKeyRowSelection"
          @refresh="handleRefreshKeys"
          @clear-key="handleClearKey"
        />
      </a-col>

      <a-col :lg="8" :md="8" :xs="24" v-perms:has="['monitor:cache:query']">
        <CacheValuePanel :loading="cacheValueLoading" :data="cacheValue" />
      </a-col>
    </a-row>
  </PageContainer>
</template>
