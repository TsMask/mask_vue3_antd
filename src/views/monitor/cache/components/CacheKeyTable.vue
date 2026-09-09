<script setup lang="ts">
import { ProTable, type ProColumns } from 'antdv-pro-table';

defineProps<{
  loading: boolean;
  dataSource: Record<string, any>[];
  rowSelection: Record<string, any>;
}>();

const emit = defineEmits<{
  refresh: [];
  clearKey: [cacheKey: string];
}>();

const cacheKeyColumns: ProColumns[] = [
  {
    title: '序号',
    dataIndex: 'num',
    width: 50,
    align: 'left',
    renderText: (_value, _record, index) => index + 1,
  },
  {
    title: '缓存键名',
    dataIndex: 'cache_key',
    align: 'left',
    width: 150,
    ellipsis: true,
    customFilterDropdown: true,
    onFilter: (value, record) =>
      String(record.cache_key)
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  },
  { title: '操作', key: 'option', align: 'left', width: 50 },
];
</script>

<template>
  <a-card
    title="键名列表"
    :bordered="false"
    :body-style="{ marginBottom: '24px', padding: 0 }"
  >
    <template #extra>
      <a-tooltip placement="topRight">
        <template #title>刷新</template>
        <a-button type="text" @click.prevent="emit('refresh')">
          <template #icon>
            <ReloadOutlined />
          </template>
        </a-button>
      </a-tooltip>
    </template>

    <ProTable
      row-key="cache_key"
      size="small"
      :columns="cacheKeyColumns"
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
            title="确认要删除该缓存键吗?"
            ok-text="确认"
            cancel-text="取消"
            @confirm="emit('clearKey', record.cache_key)"
          >
            <a-button type="text" v-perms:has="['monitor:cache:remove']">
              <template #icon>
                <DeleteOutlined />
              </template>
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </ProTable>
  </a-card>
</template>
