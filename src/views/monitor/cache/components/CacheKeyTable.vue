<script setup lang="ts">
import { h } from 'vue';
import { Input, type InputProps } from 'antdv-next';
import type { FilterDropdownProps } from 'antdv-next/dist/table/interface';
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
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }: FilterDropdownProps) =>
      h(Input, {
        placeholder: '请输入关键字',
        size: 'small',
        allowClear: true,
        value: String(selectedKeys[0] ?? ''),
        onChange: (e: Parameters<NonNullable<InputProps['onChange']>>[0]) => {
          const keyword = e.target.value ?? '';
          setSelectedKeys(keyword ? [keyword] : []);
        },
        onPressEnter: () => confirm(),
        onBlur: () => confirm(),
      }),
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
    variant="borderless"
    :styles="{ body: { marginBottom: '24px', padding: 0 } }"
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
        #filterDropdown="{
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }"
      >
        <div style="padding: 8px">
          <a-input
            placeholder="模糊过滤"
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
