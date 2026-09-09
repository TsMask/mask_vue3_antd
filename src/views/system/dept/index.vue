<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, reactive, computed, watch } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import {
  ProTable,
  type ProColumns,
  type ProColumnsSearch,
} from 'antdv-pro-table';
import DeptFormModal from './components/DeptFormModal.vue';
import { listDept, delDept } from '@/api/system/dept';
import { parseDateToStr } from '@/utils/date-utils';
import { parseDataToTree } from '@/utils/parse-tree-utils';
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
  keyMap: { sysNormalDisable: 'sys_normal_disable' },
});

const { dataSource, loading, onSearch, onReset, onTableChange, reload } =
  useProTable({
    queryFn: listDept,
    defaultPageSize: 20,
  });

/** 树表格展示数据，也作为新增部门时可选的上级部门树。 */
const deptTreeData = computed(() => parseDataToTree(dataSource.value, 'id'));

const expandedRowAll = ref(true);
const expandedRowKeys: (string | number)[] = reactive([]);
/** 所有父节点 key，用于“全部展开”。 */
let allParentRowKeys: (string | number)[] = [];
const deptFormModal = ref<InstanceType<typeof DeptFormModal> | null>(null);
const { confirmAction } = useModalAction();

/** 首次加载后初始化展开状态。 */
watch(
  dataSource,
  newData => {
    if (newData.length > 0 && allParentRowKeys.length === 0) {
      allParentRowKeys = [
        ...new Set(newData.map((item: any) => item.parent_id)),
      ];
      expandedRowKeys.length = 0;
      expandedRowKeys.push(...allParentRowKeys);
      handleToggleExpandAll(expandedRowAll.value);
    }
  },
  { once: true }
);

const tableColumns = computed<ProColumns[]>(() => [
  { title: '部门名称', dataIndex: 'dept_name', align: 'left', width: 200 },
  { title: '部门编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '部门排序', dataIndex: 'dept_sort', align: 'left', width: 100 },
  {
    title: '部门状态',
    dataIndex: 'dept_status',
    key: 'dept_status',
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
    width: 150,
    fixed: 'right',
  },
]);

const tableScroll = useProTableScroll(tableColumns);

const searchColumns = computed<ProColumnsSearch[]>(() => [
  { title: '部门名称', dataIndex: 'dept_name' },
  {
    title: '部门状态',
    dataIndex: 'dept_status',
    valueType: 'select',
    valueEnum: toProValueEnum(dict.sysNormalDisable),
  },
]);

/** 全部展开只展开父节点，折叠时清空受控展开集合 */
function handleToggleExpandAll(checked: boolean | string | number) {
  expandedRowKeys.length = 0;
  if (checked) expandedRowKeys.push(...allParentRowKeys);
}

function handleExpandedRowsChange(expandedRows: (string | number)[]) {
  expandedRowKeys.length = 0;
  expandedRowKeys.push(...expandedRows);
}

function handleView(id: string | number) {
  deptFormModal.value?.openView(id);
}

function handleEdit(id?: string | number, parentDeptId?: string | number) {
  deptFormModal.value?.openEdit(id, parentDeptId);
}

function handleFormSuccess() {
  reload();
}

/** 删除部门前交由后端校验是否存在子部门或绑定用户 */
function handleDelete(id: string | number) {
  confirmAction({
    content: `确认删除部门编号为 【${id}】 的数据项?`,
    action: () => delDept(id),
    successText: '删除成功',
    onSuccess: () => reload(),
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户部门标记 </a-typography-paragraph>
    </template>

    <ProTable
      row-key="id"
      :columns="tableColumns"
      :data-source="deptTreeData"
      :loading="loading"
      :pagination="false"
      @change="onTableChange"
      :scroll="tableScroll"
      :expanded-row-keys="expandedRowKeys"
      children-column-name="children"
      @expandedRowsChange="handleExpandedRowsChange"
      :search="{ columns: searchColumns, onSearch, onReset }"
      :toolbar="{
        setting: { columnsStateKey: 'system-dept', columnsStateType: 'local' },
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
            v-perms:has="['system:dept:add']"
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
            @change="handleToggleExpandAll"
          />
        </a-tooltip>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dept_status'">
          <DictTag
            :options="dict.sysNormalDisable"
            :value="record.dept_status"
          />
        </template>
        <template v-if="column.key === 'operation'">
          <a-space :size="8" align="center">
            <a-tooltip placement="topRight">
              <template #title>查看详情</template>
              <a-button
                type="link"
                @click.prevent="handleView(record.id)"
                v-perms:has="['system:dept:query']"
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
                v-perms:has="['system:dept:edit']"
              >
                <template #icon>
                  <FormOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight" v-if="record.parent_id !== 0">
              <template #title>删除</template>
              <a-button
                type="link"
                @click.prevent="handleDelete(record.id)"
                v-perms:has="['system:dept:remove']"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="topRight" v-if="record.dept_status !== '0'">
              <template #title>新增子部门</template>
              <a-button
                type="link"
                @click.prevent="handleEdit(undefined, record.id)"
                v-perms:has="['system:dept:add']"
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

    <DeptFormModal
      ref="deptFormModal"
      :dept-tree-data="deptTreeData"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>
