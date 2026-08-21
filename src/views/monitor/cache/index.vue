<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { message } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table/Table';
import {
  listCacheName,
  listCacheKey,
  getCacheValue,
  clearCacheName,
  clearCacheKey,
  clearCacheSafe,
} from '@/api/monitor/cache';
import { hasPermissions } from '@/plugins/auth-user';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useListQuery } from '@/hooks/useListQuery';
import { useAction } from '@/hooks/useAction';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

/** 缓存名称列表 */
const { listData: cacheNameData, loading: cacheNameLoading, fetch: fetchCacheNames } = useListQuery({
  queryFn: () => listCacheName(),
});

/** 当前选中的缓存名称 */
let selectedCacheName = '';

/** 缓存键名列表 */
const { listData: cacheKeyData, loading: cacheKeyLoading, fetch: fetchCacheKeys } = useListQuery({
  queryFn: () => listCacheKey(selectedCacheName),
  immediate: false,
});

/** 选择缓存名称，加载键名列表 */
function handleSelectCacheName(cache_name: string) {
  selectedCacheName = cache_name;
  fetchCacheKeys();
}

/** 刷新键名列表 */
function handleRefreshKeys() {
  if (!selectedCacheName) {
    message.warning({ content: '请在缓存列表中选择数据项！', duration: 3 });
    return;
  }
  fetchCacheKeys();
}

/** 缓存内容信息 */
const cacheKeyInfo = reactive({
  loading: false,
  data: { cache_key: '', cache_name: '', cache_value: '', remark: '' },
});

/** 查询缓存内容详细 */
function handleCacheKeyInfo(cache_key: string) {
  if (!hasPermissions(['monitor:cache:query'])) return;
  cacheKeyInfo.loading = true;
  getCacheValue(selectedCacheName, cache_key)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        if (res.data.cache_value) {
          try {
            res.data.cache_value = JSON.stringify(JSON.parse(res.data.cache_value), null, 2);
          } catch {
            // 非 JSON 格式保持原样
          }
        }
        Object.assign(cacheKeyInfo.data, res.data);
      }
    })
    .finally(() => {
      cacheKeyInfo.loading = false;
    });
}

/** 安全清理缓存 mutation */
const { execute: clearSafeRun } = useAction({
  action: () => clearCacheSafe(),
  successText: '已完成安全清理缓存',
  onSuccess: () => {
    cacheKeyInfo.loading = true;
    cacheKeyData.value = [];
  },
});

/** 清理缓存名称 mutation */
const { execute: clearNameRun } = useAction({
  action: (cache_name: string) => clearCacheName(cache_name),
  successText: '缓存名称已清理',
  onSuccess: (_res, cache_name) => {
    if (cacheKeyInfo.data.cache_name === cache_name) {
      cacheKeyInfo.loading = true;
    }
    fetchCacheKeys();
  },
});

/** 删除缓存键名 mutation */
const { execute: clearKeyRun } = useAction({
  action: (cache_key: string) => clearCacheKey(selectedCacheName, cache_key),
  successText: '缓存键名已删除',
  onSuccess: (_res, cache_key) => {
    fetchCacheKeys();
    if (cacheKeyInfo.data.cache_key === cache_key) {
      cacheKeyInfo.loading = true;
    }
  },
});

/** 键名列表表格字段列 */
const cacheKeyTableColumns: ColumnsType = [
  { title: '序号', dataIndex: 'num', width: 50, align: 'left', customRender(opt) { return opt.index + 1; } },
  {
    title: '缓存键名', dataIndex: 'cache_key', align: 'left', width: 150, ellipsis: true,
    customRender(opt) { return opt.text; },
    customFilterDropdown: true,
    onFilter: (value, record) => {
      if (typeof value === 'string') {
        return record.cache_key.toLowerCase().includes(value.toLowerCase());
      }
    },
  },
  { title: '操作', key: 'option', align: 'left', width: 50 },
];

/** 缓存列表表格字段列 */
const cacheNameTableColumns: ColumnsType = [
  { title: '序号', dataIndex: 'num', width: 50, align: 'left', customRender(opt) { return opt.index + 1; } },
  {
    title: '缓存名称', dataIndex: 'cache_name', align: 'left', width: 150, ellipsis: true,
    customRender(opt) { return opt.text; },
    customFilterDropdown: true,
    onFilter: (value, record) => {
      if (typeof value === 'string') {
        return record.cache_name.toLowerCase().includes(value.toLowerCase());
      }
    },
  },
  { title: '备注', dataIndex: 'remark', align: 'left', width: 150, ellipsis: true },
  { title: '操作', key: 'option', align: 'left', width: 50 },
];

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
        <a-card title="缓存列表" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
          <template #extra>
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>刷新</template>
                <a-button type="text" @click.prevent="fetchCacheNames">
                  <template #icon>
                    <ReloadOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>安全清理</template>
                <a-popconfirm placement="bottomRight" title="确认要执行可安全清理的缓存下所有键名吗?" ok-text="确认" cancel-text="取消"
                  @confirm="clearSafeRun(undefined)">
                  <a-button type="text" v-perms:has="['monitor:cache:remove']">
                    <template #icon>
                      <ClearOutlined />
                    </template>
                  </a-button>
                </a-popconfirm>
              </a-tooltip>
            </a-space>
          </template>
          <a-table row-key="cache_name" size="small" :columns="cacheNameTableColumns" :data-source="cacheNameData"
            :loading="cacheNameLoading" :scroll="{ y: 'calc(100vh - 380px)' }" :pagination="false" :row-selection="{
              type: 'radio',
              onChange: (selectedRowKeys: (string | number)[]) => handleSelectCacheName(selectedRowKeys[0] as string),
            }">
            <template #customFilterDropdown="{
              setSelectedKeys,
              selectedKeys,
              confirm,
              clearFilters,
              column,
            }">
              <div style="padding: 8px">
                <a-input :placeholder="`模糊过滤 ${column.title}`" :value="selectedKeys[0]"
                  style="width: 188px; margin-bottom: 8px; display: block" @change="
                    (e: any) => setSelectedKeys(e.target.value ? [e.target.value] : [])
                  " @pressEnter="confirm()" />
                <a-button type="primary" size="small" style="width: 90px; margin-right: 8px" @click="confirm()">
                  过滤
                </a-button>
                <a-button size="small" style="width: 90px" @click="clearFilters({ confirm: true })">
                  重置
                </a-button>
              </div>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'option'">
                <a-popconfirm placement="topRight" title="确认要清理该缓存名称下的所有键名吗?" ok-text="确认" cancel-text="取消"
                  @confirm="clearNameRun(record.cache_name)">
                  <a-button type="text" v-perms:has="['monitor:cache:remove']">
                    <template #icon>
                      <ClearOutlined />
                    </template>
                  </a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <a-col :lg="8" :md="8" :xs="24">
        <a-card title="键名列表" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }">
          <template #extra>
            <a-tooltip placement="topRight">
              <template #title>刷新</template>
              <a-button type="text" @click.prevent="handleRefreshKeys">
                <template #icon>
                  <ReloadOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </template>
          <a-table row-key="cache_key" size="small" :columns="cacheKeyTableColumns" :data-source="cacheKeyData"
            :loading="cacheKeyLoading" :scroll="{ y: 'calc(100vh - 380px)' }" :pagination="false" :row-selection="{
              type: 'radio',
              onChange: (selectedRowKeys: (string | number)[]) => handleCacheKeyInfo(selectedRowKeys[0] as string),
            }">
            <template #customFilterDropdown="{
              setSelectedKeys,
              selectedKeys,
              confirm,
              clearFilters,
              column,
            }">
              <div style="padding: 8px">
                <a-input :placeholder="`模糊过滤 ${column.title}`" :value="selectedKeys[0]"
                  style="width: 188px; margin-bottom: 8px; display: block" @change="
                    (e: any) => setSelectedKeys(e.target.value ? [e.target.value] : [])
                  " @pressEnter="confirm()" />
                <a-button type="primary" size="small" style="width: 90px; margin-right: 8px" @click="confirm()">
                  过滤
                </a-button>
                <a-button size="small" style="width: 90px" @click="clearFilters({ confirm: true })">
                  重置
                </a-button>
              </div>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'option'">
                <a-popconfirm placement="topRight" title="确认要删除该缓存键吗?" ok-text="确认" cancel-text="取消"
                  @confirm="clearKeyRun(record.cache_key)">
                  <a-button type="text" v-perms:has="['monitor:cache:remove']">
                    <template #icon>
                      <DeleteOutlined />
                    </template>
                  </a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <a-col :lg="8" :md="8" :xs="24" v-perms:has="['monitor:cache:query']">
        <a-card title="缓存内容" :bordered="false" :body-style="{ marginBottom: '24px', padding: 0 }"
          :loading="cacheKeyInfo.loading">
          <a-descriptions size="small" layout="vertical" :bordered="true" :column="1">
            <a-descriptions-item label="缓存名称">
              {{ cacheKeyInfo.data.cache_name }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存键名">
              {{ cacheKeyInfo.data.cache_key }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存内容">
              <a-typography-paragraph>
                <a-textarea :value="cacheKeyInfo.data.cache_value" :auto-size="{ minRows: 4, maxRows: 18 }"
                  :maxlength="4000" :disabled="true" style="color: rgba(0, 0, 0, 0.85)" placeholder="显示缓存内容" />
              </a-typography-paragraph>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </PageContainer>
</template>

<style lang="less" scoped></style>
