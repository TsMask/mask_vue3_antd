<script setup lang="ts">
import { ProTable, type ProColumns } from 'antdv-pro-table';

defineProps<{
  loading: boolean;
  dataSource: Record<string, any>[];
  rowSelection: Record<string, any>;
}>();

const emit = defineEmits<{
  refresh: [];
  clearSafe: [];
  clearName: [cacheName: string];
}>();

const cacheNameColumns: ProColumns[] = [
  {
    title: '序号',
    dataIndex: 'num',
    width: 50,
    align: 'left',
    renderText: (_value, _record, index) => index + 1,
  },
  {
    title: '缓存名称',
    dataIndex: 'cache_name',
    align: 'left',
    width: 150,
    ellipsis: true,
    customFilterDropdown: true,
    onFilter: (value, record) =>
      String(record.cache_name)
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  },
  {
    title: '备注',
    dataIndex: 'remark',
    align: 'left',
    width: 150,
    ellipsis: true,
  },
  { title: '操作', key: 'option', align: 'left', width: 50 },
];
</script>

<template>
  <a-card
    title="缓存列表"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
  >
    <template #extra>
      <a-space :size="8" align="center">
        <a-tooltip placement="topRight">
          <template #title>刷新</template>
          <a-button type="text" @click.prevent="emit('refresh')">
            <template #icon>
              <ReloadOutlined />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip placement="topRight">
          <template #title>安全清理</template>
          <a-popconfirm
            placement="bottomRight"
            title="确认要执行可安全清理的缓存下所有键名吗?"
            ok-text="确认"
            cancel-text="取消"
            @confirm="emit('clearSafe')"
          >
            <a-button type="text" v-perms:has="['monitor:cache:remove']">
              <template #icon>
                <ClearOutlined />
              </template>
            </a-button>
          </a-popconfirm>
        </a-tooltip>
      </a-space>
    </template>

    <ProTable
      row-key="cache_name"
      size="small"
      :columns="cacheNameColumns"
      :data-source="dataSource"
      :loading="loading"
      :scroll="{ y: 'calc(100vh - 380px)' }"
      :pagination="false"
      :row-selection="rowSelection"
      :search="false"
      :toolbar="false"
      :card-props="false"
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
              (e: any) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
            "
            @press-enter="confirm()"
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
            title="确认要清理该缓存名称下的所有键名吗?"
            ok-text="确认"
            cancel-text="取消"
            @confirm="emit('clearName', record.cache_name)"
          >
            <a-button type="text" v-perms:has="['monitor:cache:remove']">
              <template #icon>
                <ClearOutlined />
              </template>
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </ProTable>
  </a-card>
</template>
