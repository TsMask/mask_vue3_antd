<template>
  <page-container :title="title">
    <template #content>
      <a-typography-paragraph>
        登录用户
        <a-typography-text code>Token</a-typography-text>
        授权标识记录，存储在
        <a-typography-text code>Redis</a-typography-text>
        中，可撤销对用户的授权，拒绝用户请求并强制退出。
      </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form
        :model="queryParams"
        name="table-search"
        layout="horizontal"
        autocomplete="off"
      >
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="菜单名称" name="menuName">
              <a-input
                v-model:value="queryParams.menuName"
                allow-clear
                placeholder="请输入菜单名称"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="状态">
              <a-select
                v-model:value="queryParams.status"
                allow-clear
                placeholder="请选择菜单状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="24" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="getList">
                  <template #icon><SearchOutlined /></template>
                  搜 索</a-button
                >
                <a-button type="default" @click.prevent="fnResetQuery">
                  <template #icon><ClearOutlined /></template>
                  重 置</a-button
                >
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <!-- 插槽-卡片左侧侧 -->
      <template #title>
        <a-button type="primary">
          <template #icon><PlusOutlined /></template>
          新 增
        </a-button>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip>
            <template #title>展开/折叠</template>
            <a-switch
              v-model:checked="tableState.expandedRowAll"
              checked-children="展"
              un-checked-children="折"
              size="small"
              @change="fnTableExpandedRowsAll"
            />
          </a-tooltip>
          <a-tooltip>
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="显"
              un-checked-children="隐"
              size="small"
            />
          </a-tooltip>
          <a-tooltip>
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="getList">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip>
            <template #title>密度</template>
            <a-dropdown trigger="click">
              <a-button type="text">
                <template #icon><ColumnHeightOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu @click="fnTableSize">
                  <a-menu-item key="default">默认</a-menu-item>
                  <a-menu-item key="middle">中等</a-menu-item>
                  <a-menu-item key="small">紧凑</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>

      <!-- 表格列表 -->
      <a-table
        class="table"
        children-column-name="children"
        row-key="menuId"
        :indent-size="18"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :scroll="{ x: true }"
        :pagination="false"
        :expanded-row-keys="tableState.expandedRowKeys"
        @expandedRowsChange="fnTableExpandedRowsChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.status" />
          </template>
          <template v-if="column.key === 'menuId'">
            <a-button type="link" @click.prevent="fnForceLogout(record)">
              <template #icon><LogoutOutlined /></template>
              强 退</a-button
            >
          </template>
        </template>
      </a-table>
    </a-card>
  </page-container>
</template>

<script setup lang="ts">
import {
  PlusOutlined,
  LogoutOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, watch } from 'vue';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import {
  addMenu,
  delMenu,
  getMenu,
  listMenu,
  updateMenu,
} from '@/api/system/menu';
import { message, Modal } from 'ant-design-vue';
import { ColumnsType } from 'ant-design-vue/lib/table';
import { parseDateToStr, YYYY_MM_DD_HH_MM_SS } from '@/utils/DateUtils';
import { parseDataToTree } from '@/utils/ParseUtils';
import { Key } from 'ant-design-vue/lib/table/interface';
import useDictStore from '@/store/modules/dict';
const { getDict } = useDictStore();

/**字典数据 */
let dict: {
  /**菜单侧边栏显示状态 */
  syShowHide: DictType[];
  /**菜单状态 */
  sysNormalDisable: DictType[];
} = reactive({
  syShowHide: [],
  sysNormalDisable: [],
});

const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**查询参数 */
let queryParams = reactive({
  /**菜单名称 */
  menuName: undefined,
  /**状态 */
  status: undefined,
});

/**表格全展开行key */
let expandedRowKeys: string[] = [];

/**表格状态类型 */
type TabeStateType = {
  /**加载等待 */
  loading: boolean;
  /**紧凑型 */
  size: SizeType;
  /**搜索栏 */
  seached: boolean;
  /**记录数据 */
  data: object[];
  /**全展开 */
  expandedRowAll: boolean;
  /**展开行key */
  expandedRowKeys: Key[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  seached: false,
  data: [],
  expandedRowAll: false,
  expandedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '菜单名称',
    dataIndex: 'menuName',
    align: 'center',
  },
  {
    title: '图标',
    dataIndex: 'icon',
    align: 'center',
    width: '100px',
  },
  {
    title: '排序',
    dataIndex: 'orderNum',
    align: 'center',
    width: '60px',
  },
  {
    title: '所属部门',
    dataIndex: 'deptName',
    align: 'center',
  },
  {
    title: '权限标识',
    dataIndex: 'perms',
    align: 'center',
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: '80px',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'center',
    customRender(opt) {
      return parseDateToStr(+opt.value, YYYY_MM_DD_HH_MM_SS);
    },
  },
  {
    title: '操作',
    key: 'menuId',
    align: 'center',
  },
];

/**表格展开行key */
function fnTableExpandedRowsAll(checked: boolean | string | number) {
  tableState.expandedRowKeys = checked ? expandedRowKeys : [];
}

/**表格展开行key */
function fnTableExpandedRowsChange(expandedRows: Key[]) {
  tableState.expandedRowKeys = expandedRows;
}

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/** 重置按钮操作 */
function fnResetQuery() {
  queryParams.menuName = undefined;
  queryParams.status = undefined;
  getList();
}

/** 查询菜单列表 */
async function getList() {
  tableState.loading = true;
  const res = await listMenu(queryParams);
  if (res.code === 200 && Array.isArray(res.data)) {
    expandedRowKeys = res.data.map(item => item.menuId);
    tableState.data = parseDataToTree(res.data, '0', 'menuId');
    tableState.loading = false;
  }
}

/** 强退按钮操作 */
function fnForceLogout(row: Record<string, string>) {
  Modal.confirm({
    title: '提示',
    content: `是否确认强退用户名称为 ${row.userName} 的用户?`,
    async onOk() {
      // await forceLogout(row.tokenId);
      message.success(`已强退用户 ${row.userName}`, 1.5);
      await getList();
    },
    onCancel() {},
  });
}

onMounted(async () => {
  // 初始字典数据
  dict.sysNormalDisable = await getDict('sys_normal_disable');
  dict.syShowHide = await getDict('sys_show_hide');
  // 初始列表数据
  await getList();
});
</script>

<style lang="less" scoped></style>
