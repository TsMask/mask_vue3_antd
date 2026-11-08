<script setup lang="ts">
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import IconFont from '@/components/IconFont/IconFont.vue';
import MenuFormModal from './components/MenuFormModal.vue';
import { useRoute } from 'vue-router';
import { ref, computed, watch } from 'vue';
import { delMenu, listMenu } from '@/api/system/menu';
import {
  parseDataToTree,
  parseDataToTreeExclude,
} from '@/utils/parseTree';
import { parseDateToStr } from '@/utils/date';
import { MENU_TYPE_AUTH } from '@/constants/menu';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalAction } from '@/hooks/useModalAction';
import {
  toProValueEnum,
  useProTable,
  useProTableScroll,
} from '@/hooks/useProTable';

const route = useRoute();
const title = ref<string>(route.meta.title ?? '标题');

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysShowHide: 'sys_show_hide',
  },
});

const { dataSource, loading, onSearch, onReset, onTableChange, reload } =
  useProTable({
    queryFn: listMenu,
    defaultPageSize: 20,
  });

/** 树形表格展示数据 */
const treeTableData = computed(() =>
  parseDataToTree(dataSource.value as any[], 'id')
);

/** 弹窗用父菜单树：排除权限节点，并补一个虚拟根节点。 */
const parentMenuTreeData = computed(() => {
  if (dataSource.value.length === 0) return [];
  const data = JSON.parse(JSON.stringify(dataSource.value));
  return [
    {
      id: '0',
      menu_name: '根节点',
      children: parseDataToTreeExclude(data, 'menu_type', MENU_TYPE_AUTH, 'id'),
    },
  ];
});

/** 所有父节点 ID，用于展开/折叠全部。 */
const allParentRowKeys = computed(() => [
  ...new Set(dataSource.value.map((item: any) => item.parent_id)),
]);
const expandedRowKeys = ref<(string | number)[]>([]);
const expandedRowAll = ref(false);
const menuFormModal = ref<InstanceType<typeof MenuFormModal> | null>(null);
const { confirmAction } = useModalAction();

/** 受控展开父节点集合，数据刷新后仍保持“全部展开”的意图 */
function handleExpandAll(checked: boolean | string | number) {
  expandedRowAll.value = !!checked;
  expandedRowKeys.value = checked ? allParentRowKeys.value : [];
}

function handleExpandedRowsChange(rows: (string | number)[]) {
  expandedRowKeys.value = rows;
}

watch(allParentRowKeys, keys => {
  if (expandedRowAll.value) {
    expandedRowKeys.value = keys;
  }
});

const tableColumns = computed<ProColumns[]>(() => [
  { title: '菜单名称', dataIndex: 'menu_name', align: 'left', width: 200 },
  { title: '菜单编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '菜单排序', dataIndex: 'menu_sort', align: 'left', width: 100 },
  {
    title: '菜单图标',
    dataIndex: 'menu_icon',
    key: 'menu_icon',
    align: 'left',
    width: 100,
  },
  { title: '权限标识', dataIndex: 'menu_perms', align: 'left', width: 200 },
  { title: '组件路径', dataIndex: 'menu_component', align: 'left', width: 200 },
  {
    title: '显示状态',
    dataIndex: 'menu_visible',
    key: 'menu_visible',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysShowHide),
  },
  {
    title: '菜单状态',
    dataIndex: 'menu_status',
    key: 'menu_status',
    align: 'left',
    width: 100,
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 200,
    renderText: value => (+value <= 0 ? '' : parseDateToStr(+value)),
  },
  {
    title: '操作',
    key: 'operation',
    align: 'left',
    width: 200,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '菜单名称', dataIndex: 'menu_name' },
  {
    title: '菜单状态',
    dataIndex: 'menu_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

function handleView(id: string | number) {
  menuFormModal.value?.openView(id);
}

/** 支持直接编辑当前节点，或在指定父节点下预填类型新建子菜单 */
function handleEdit(
  id?: string | number,
  parent_id?: string | number,
  parentType?: string | number
) {
  menuFormModal.value?.openEdit(id, parent_id, parentType);
}

function handleFormSuccess() {
  reload();
}

/** 删除菜单前交由后端校验是否存在子菜单 */
function handleDelete(id: string | number) {
  confirmAction({
    content: `确认删除菜单编号为【${id}】的数据项?`,
    action: () => delMenu(id),
    successText: '删除成功',
    onSuccess: () => reload(),
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        动态路由菜单，根节点下创建菜单会用使用菜单编号作为菜单目录路径。
      </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="treeTableData"
      :loading="loading"
      :pagination="false"
      @change="onTableChange"
      :scroll="tableScroll"
      :expanded-row-keys="expandedRowKeys"
      children-column-name="children"
      @expandedRowsChange="handleExpandedRowsChange"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: { columnsStateKey: 'system-menu', columnsStateType: 'local' },
        onReload: reload,
      }"
    >
      <template #toolBarRender>
        <a-space
          :size="8"
          align="center"
          :style="{ flexWrap: 'wrap', marginBottom: '8px' }"
        >
          <a-button
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['system:menu:add']"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
        </a-space>
      </template>
      <template #toolbarRight>
        <a-tooltip placement="topRight">
          <template #title>展开/折叠</template>
          <a-switch
            v-model:checked="expandedRowAll"
            checked-children="展"
            un-checked-children="折"
            size="small"
            @change="handleExpandAll"
          />
        </a-tooltip>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'menu_icon'">
          <IconFont :type="record.menu_icon" style="font-size: 18px" />
        </template>
        <template v-if="column.key === 'menu_visible'">
          <DictTag :options="dict.sysShowHide" :value="record.menu_visible" />
        </template>
        <template v-if="column.key === 'menu_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.menu_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:menu:query']"
              >
                <template #icon>
                  <ProfileOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>编辑</template>
              <a-button
                type="link"
                @click.prevent="handleEdit(record.id)"
                v-perms:has="['system:menu:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight">
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:menu:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              placement="topRight"
              v-if="record.menu_type !== MENU_TYPE_AUTH"
            >
              <template #title>新增子菜单</template>
              <a-button
                type="link"
                @click.prevent="
                  handleEdit(undefined, record.id, record.menu_type)
                "
                v-perms:has="['system:menu:add']"
              >
                <template #icon>
                  <PlusOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </ProTable>

    <MenuFormModal
      ref="menuFormModal"
      :menu-tree-data="parentMenuTreeData"
      :menu-list="dataSource"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>
