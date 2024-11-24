<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import {
  listCacheName,
  listCacheKey,
  getCacheValue,
  clearCacheName,
  clearCacheKey,
  clearCacheSafe,
} from '@/api/monitor/cache';
import { PageContainer } from 'antdv-pro-layout';
import { ColumnsType } from 'ant-design-vue/lib/table/Table';
import { message } from 'ant-design-vue/lib';
import { hasPermissions } from '@/plugins/auth-user';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**请求点击 */
let isClick = ref<boolean>(false);

/**缓存内容信息 */
let cacheKeyInfo = reactive({
  loading: true,
  data: {
    cacheKey: '',
    cacheName: '',
    cacheValue: '',
    remark: '',
  },
});

/**
 * 查询缓存内容详细
 * @param cacheKey
 */
function fnCacheKeyInfo(cacheKey: string) {
  if (!hasPermissions(['monitor:cache:query'])) return;
  if (isClick.value) return;
  isClick.value = true;
  cacheKeyInfo.loading = true;
  getCacheValue(cacheKeyTable.cacheName, cacheKey).then(res => {
    isClick.value = false;
    if (res.code === RESULT_CODE_SUCCESS) {
      Object.assign(cacheKeyInfo.data, res.data);
      cacheKeyInfo.loading = false;
    }
  });
}

/**键名列表表格字段列 */
let cacheKeyTableColumns: ColumnsType = [
  {
    title: '序号',
    dataIndex: 'num',
    width: 50,
    align: 'center',
    customRender(opt) {
      return opt.index + 1;
    },
  },
  {
    title: '缓存键名',
    dataIndex: 'cacheKey',
    align: 'left',
    width: 150,
    ellipsis: true,
    // 渲染值处理
    customRender(opt) {
      return opt.text;
    },
    // 自定义过滤控件
    customFilterDropdown: true,
    onFilter: (value, record) => {
      if (typeof value === 'string') {
        const nameLower = record.cacheKey.toLowerCase();
        return nameLower.includes(value.toLowerCase());
      }
    },
  },
  {
    title: '操作',
    key: 'option',
    align: 'center',
    width: 50,
  },
];

/**键名列表表格数据 */
let cacheKeyTable = reactive({
  loading: false,
  data: [],
  /**当前键名列表的缓存名称 */
  cacheName: '',
});

/**
 * 清理指定缓存键名
 * @param cacheKey 键名列表中的缓存键名
 */
function fnCacheKeyClear(cacheKey: string) {
  if (isClick.value) return;
  isClick.value = true;
  const hide = message.loading('请稍等...', 0);
  clearCacheKey(cacheKeyTable.cacheName, cacheKey).then(res => {
    hide();
    isClick.value = false;
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({
        content: `已删除缓存键名 ${cacheKey}`,
        duration: 3,
      });
      // 缓存内容显示且是删除的缓存键名，需要进行加载显示
      if (!cacheKeyInfo.loading && cacheKeyInfo.data.cacheKey === cacheKey) {
        cacheKeyInfo.loading = true;
      }
    } else {
      message.error({
        content: res.msg,
        duration: 3,
      });
    }
    fnCacheKeyList();
  });
}

/** 查询缓存键名列表 */
function fnCacheKeyList(cacheName: string = 'load') {
  if (cacheName === 'load') {
    cacheName = cacheKeyTable.cacheName;
  }
  if (!cacheName) {
    message.warning('请在缓存列表中选择数据项！', 3);
    return;
  }
  if (isClick.value) return;
  isClick.value = true;
  cacheKeyTable.loading = true;
  listCacheKey(cacheName).then(res => {
    isClick.value = false;
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      cacheKeyTable.cacheName = cacheName;
      cacheKeyTable.data = res.data;
      cacheKeyTable.loading = false;
    }
  });
}

/**缓存列表表格数据 */
let cacheNameTable = reactive({
  loading: true,
  data: [],
});

/**缓存列表表格字段列 */
let cacheNameTableColumns: ColumnsType = [
  {
    title: '序号',
    dataIndex: 'num',
    width: 50,
    align: 'center',
    customRender(opt) {
      return opt.index + 1;
    },
  },
  {
    title: '缓存名称',
    dataIndex: 'cacheName',
    align: 'left',
    width: 150,
    ellipsis: true,
    // 渲染值处理
    customRender(opt) {
      return opt.text;
    },
    // 自定义过滤控件
    customFilterDropdown: true,
    onFilter: (value, record) => {
      if (typeof value === 'string') {
        const nameLower = record.cacheName.toLowerCase();
        return nameLower.includes(value.toLowerCase());
      }
    },
  },
  {
    title: '备注',
    dataIndex: 'remark',
    align: 'left',
    width: 150,
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'option',
    align: 'center',
    width: 50,
  },
];

/**安全清理缓存 */
function fnClearCacheSafe() {
  if (isClick.value) return;
  isClick.value = true;
  const hide = message.loading('请稍等...', 0);
  clearCacheSafe().then(res => {
    hide();
    isClick.value = false;
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({
        content: '已完成安全清理缓存',
        duration: 3,
      });
      cacheKeyTable.loading = true;
      cacheKeyInfo.loading = true;
    } else {
      message.error({
        content: res.msg,
        duration: 3,
      });
    }
  });
}

/**
 * 清理指定缓存名称
 * @param cacheName 缓存名称
 */
function fnCacheNameClear(cacheName: string) {
  if (isClick.value) return;
  isClick.value = true;
  const hide = message.loading('请稍等...', 0);
  clearCacheName(cacheName).then(res => {
    hide();
    isClick.value = false;
    if (res.code === RESULT_CODE_SUCCESS) {
      message.success({
        content: `已清理缓存名称 ${cacheName}`,
        duration: 3,
      });
      // 缓存内容显示且是删除的缓存名称，需要进行加载显示
      if (!cacheKeyInfo.loading && cacheKeyInfo.data.cacheName === cacheName) {
        cacheKeyInfo.loading = true;
      }
    } else {
      message.error({
        content: res.msg,
        duration: 3,
      });
    }
    fnCacheKeyList(cacheName);
  });
}

/**查询缓存名称列表 */
function fnCacheNameList() {
  if (isClick.value) return;
  isClick.value = true;
  cacheNameTable.loading = true;
  listCacheName().then(res => {
    isClick.value = false;
    if (res.code === RESULT_CODE_SUCCESS && res.data) {
      cacheNameTable.data = res.data;
      cacheNameTable.loading = false;
    }
  });
}

onMounted(() => {
  fnCacheNameList();
});
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
        <a-card
          title="缓存列表"
          :bordered="false"
          :body-style="{ marginBottom: '24px', padding: 0 }"
        >
          <template #extra>
            <a-space :size="8" align="center">
              <a-tooltip>
                <template #title>刷新</template>
                <a-button type="text" @click.prevent="fnCacheNameList">
                  <template #icon><ReloadOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>安全清理</template>
                <a-popconfirm
                  placement="bottomRight"
                  title="确认要执行可安全清理的缓存下所有键名吗?`"
                  ok-text="确认"
                  cancel-text="取消"
                  @confirm="fnClearCacheSafe()"
                >
                  <a-button type="text" v-perms:has="['monitor:cache:remove']">
                    <template #icon><ClearOutlined /></template>
                  </a-button>
                </a-popconfirm>
              </a-tooltip>
            </a-space>
          </template>
          <a-table
            row-key="cacheName"
            size="small"
            :columns="cacheNameTableColumns"
            :data-source="cacheNameTable.data"
            :loading="cacheNameTable.loading"
            :scroll="{ y: 'calc(100vh - 380px)' }"
            :pagination="false"
            :row-selection="{
              type: 'radio',
              onChange: (selectedRowKeys: (string|number)[]) => fnCacheKeyList(selectedRowKeys[0] as string),
            }"
          >
            <template
              #customFilterDropdown="{
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
                column,
              }"
            >
              <div style="padding: 8px">
                <a-input
                  :placeholder="`模糊过滤 ${column.title}`"
                  :value="selectedKeys[0]"
                  style="width: 188px; margin-bottom: 8px; display: block"
                  @change="
                    (e:any)=> setSelectedKeys(e.target.value ? [e.target.value] : [])
                  "
                  @pressEnter="confirm()"
                />
                <a-button
                  type="primary"
                  size="small"
                  style="width: 90px; margin-right: 8px"
                  @click="confirm()"
                >
                  过滤
                </a-button>
                <a-button
                  size="small"
                  style="width: 90px"
                  @click="clearFilters({ confirm: true })"
                >
                  重置
                </a-button>
              </div>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'option'">
                <a-popconfirm
                  placement="topRight"
                  title="确认要清理该缓存名称下的所有键名吗?`"
                  ok-text="确认"
                  cancel-text="取消"
                  @confirm="fnCacheNameClear(record.cacheName)"
                >
                  <a-button type="text" v-perms:has="['monitor:cache:remove']">
                    <template #icon><ClearOutlined /></template>
                  </a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <a-col :lg="8" :md="8" :xs="24">
        <a-card
          title="键名列表"
          :bordered="false"
          :body-style="{ marginBottom: '24px', padding: 0 }"
        >
          <template #extra>
            <a-tooltip>
              <template #title>刷新</template>
              <a-button type="text" @click.prevent="fnCacheKeyList()">
                <template #icon><ReloadOutlined /></template>
              </a-button>
            </a-tooltip>
          </template>
          <a-table
            row-key="cacheKey"
            size="small"
            :columns="cacheKeyTableColumns"
            :data-source="cacheKeyTable.data"
            :loading="cacheKeyTable.loading"
            :scroll="{ y: 'calc(100vh - 380px)' }"
            :pagination="false"
            :row-selection="{
              type: 'radio',
              onChange: (selectedRowKeys: (string|number)[]) => fnCacheKeyInfo(selectedRowKeys[0] as string),
            }"
          >
            <template
              #customFilterDropdown="{
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
                column,
              }"
            >
              <div style="padding: 8px">
                <a-input
                  :placeholder="`模糊过滤 ${column.title}`"
                  :value="selectedKeys[0]"
                  style="width: 188px; margin-bottom: 8px; display: block"
                  @change="
                    (e:any) => setSelectedKeys(e.target.value ? [e.target.value] : [])
                  "
                  @pressEnter="confirm()"
                />
                <a-button
                  type="primary"
                  size="small"
                  style="width: 90px; margin-right: 8px"
                  @click="confirm()"
                >
                  过滤
                </a-button>
                <a-button
                  size="small"
                  style="width: 90px"
                  @click="clearFilters({ confirm: true })"
                >
                  重置
                </a-button>
              </div>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'option'">
                <a-popconfirm
                  placement="topRight"
                  title="确认要删除该缓存键吗?`"
                  ok-text="确认"
                  cancel-text="取消"
                  @confirm="fnCacheKeyClear(record.cacheKey)"
                >
                  <a-button type="text" v-perms:has="['monitor:cache:remove']">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <a-col :lg="8" :md="8" :xs="24" v-perms:has="['monitor:cache:query']">
        <a-card
          title="缓存内容"
          :bordered="false"
          :body-style="{ marginBottom: '24px', padding: 0 }"
          :loading="cacheKeyInfo.loading"
        >
          <a-descriptions
            size="small"
            layout="vertical"
            :bordered="true"
            :column="1"
          >
            <a-descriptions-item label="缓存名称">
              {{ cacheKeyInfo.data.cacheName }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存键名">
              {{ cacheKeyInfo.data.cacheKey }}
            </a-descriptions-item>
            <a-descriptions-item label="缓存内容">
              <a-typography-paragraph>
                <a-textarea
                  :value="cacheKeyInfo.data.cacheValue"
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
      </a-col>
    </a-row>
  </PageContainer>
</template>

<style lang="less" scoped></style>
