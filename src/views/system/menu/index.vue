<script setup lang="ts">
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Form } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import IconFont from '@/components/IconFont/index.vue';
import { iconFonts } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { useRoute } from 'vue-router';
import { reactive, ref, computed, toRaw, onMounted, watch } from 'vue';
import {
  addMenu,
  delMenu,
  getMenu,
  listMenu,
  updateMenu,
} from '@/api/system/menu';
import {
  parseDataToTree,
  parseDataToTreeExclude,
} from '@/utils/parse-tree-utils';
import { parseDateToStr } from '@/utils/date-utils';
import {
  MENU_PATH_INLINE,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
  MENU_TYPE_AUTH,
} from '@/constants/menu-constants';
import { isSuccess } from '@/plugins/http-fetch';
import { useTableUI } from '@/hooks/useTableUI';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { useAction, confirmAction } from '@/hooks/useAction';

const route = useRoute();
const icons = reactive(iconFonts.map((item) => ({ value: item, label: item })));

const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict } = useDictSetup({ keyMap: { sysNormalDisable: 'sys_normal_disable', } });

/** 查询参数 */
const { queryParams, handleQuery, resetQuery } = useQueryParams(
  { menu_name: '', menu_status: undefined as string | undefined },
  () => { fetchList(); },
);

/** 列表数据查询 */
const { listData, loading, fetch: fetchList } = useListQuery({
  queryFn: () => listMenu(toRaw(queryParams)),
});

/** 树形表格数据（由列表数据自动转换） */
const treeTableData = computed(() => parseDataToTree(listData.value as any[], 'id'));

/** 弹窗用父菜单树数据（排除权限类型，带根节点） */
const treeDataAll = computed(() => {
  if (listData.value.length === 0) return [];
  const data = JSON.parse(JSON.stringify(listData.value));
  return [
    {
      id: '0',
      menu_name: '根节点',
      children: parseDataToTreeExclude(data, 'menu_type', MENU_TYPE_AUTH, 'id'),
    },
  ];
});

/** 所有父节点 ID（用于展开/折叠全部） */
const expandedRowKeysAll = computed(() => {
  return [...new Set(listData.value.map((item: any) => item.parent_id))];
});

const {
  tableState,
  setTableSize,
  rowClassName,
} = useTableUI();

tableState.searched = false;
const expandedRowKeys = ref<(string | number)[]>([]);
const expandedRowAll = ref(false);

/** 展开/折叠所有树形表格行 */
function handleExpandAll(checked: boolean | string | number) {
  expandedRowAll.value = !!checked;
  expandedRowKeys.value = checked ? expandedRowKeysAll.value : [];
}

/** 同步展开行键列表（受控模式） */
function handleExpandedRowsChange(rows: (string | number)[]) {
  expandedRowKeys.value = rows;
}

/** 数据更新后，若全部展开状态保持则同步最新展开键 */
watch(expandedRowKeysAll, (keys) => {
  if (expandedRowAll.value) {
    expandedRowKeys.value = keys;
  }
});

const tableColumns: ColumnsType = [
  { title: '菜单名称', dataIndex: 'menu_name', align: 'left', width: 200 },
  { title: '菜单编号', dataIndex: 'id', align: 'left', width: 100 },
  { title: '菜单排序', dataIndex: 'menu_sort', align: 'left', width: 100 },
  { title: '菜单图标', dataIndex: 'menu_icon', key: 'menu_icon', align: 'left', width: 100 },
  { title: '权限标识', dataIndex: 'menu_perms', align: 'left', width: 200 },
  { title: '组件路径', dataIndex: 'menu_component', align: 'left', width: 200 },
  { title: '显示状态', dataIndex: 'menu_visible', key: 'menu_visible', align: 'left', width: 100 },
  { title: '菜单状态', dataIndex: 'menu_status', key: 'menu_status', align: 'left', width: 100 },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    align: 'left',
    width: 200,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  { title: '操作', key: 'id', align: 'left' },
];

// ==================== 弹窗状态 ====================

const modalState = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '菜单',
  form: {} as Record<string, any>,
  confirmLoading: false,
});

const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    parent_id: [{ required: true, message: '上级菜单不能为空' }],
    menu_name: [
      { required: true, min: 1, max: 50, message: '请正确输入菜单名称' },
    ],
    menu_component: [
      { required: true, min: 1, max: 200, message: '请正确输入组件路径' },
    ],
    menu_path: [
      { required: true, min: 1, max: 200, message: '请正确输入路由地址' },
    ],
    menu_perms: [
      { required: true, min: 1, max: 100, message: '请正确输入权限标识' },
    ],
  })
);

/** 新增/编辑提交 mutation */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (data: Record<string, any>) =>
    data.id ? updateMenu(data) : addMenu(data),
  successText: '操作成功',
  onSuccess: () => {
    handleCancel();
    fetchList();
  },
});

/** 获取菜单表单默认值 */
function getDefaultForm() {
  return {
    id: undefined,
    parent_id: 0,
    menu_name: '',
    menu_sort: 0,
    menu_type: MENU_TYPE_AUTH,
    menu_component: '',
    menu_path: '',
    menu_icon: '#',
    menu_perms: '',
    menu_external: '0',
    menu_cache: '0',
    menu_visible: '0',
    menu_status: '0',
    create_time: 0,
    remark: '',
    parentType: '',
  };
}

Object.assign(modalState.form, getDefaultForm());

/** 上级菜单选择变化时，自动推断子菜单类型（目录->菜单，菜单->权限） */
function handleTreeDataChange(value: any) {
  if (!value) return;
  const menu = listData.value.find((m: any) => m.id === value);
  if (!menu) return;
  if ((menu as any).menu_type === MENU_TYPE_DIR) {
    modalState.form.menu_type = MENU_TYPE_MENU;
  }
  if ((menu as any).menu_type === MENU_TYPE_MENU) {
    modalState.form.menu_type = MENU_TYPE_AUTH;
  }
  modalState.form.parentType = (menu as any).menu_type;
}

/** 打开菜单详情弹窗，根据 id 查询并展示数据 */
function handleView(id: string | number) {
  if (!id) {
    message.error({ content: '获取菜单信息失败', duration: 3 });
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  getMenu(id)
    .then((res) => {
      if (isSuccess(res) && res.data) {
        Object.assign(modalState.form, res.data);
        modalState.title = '菜单信息';
        modalState.visibleByView = true;
      } else {
        message.error({ content: '获取菜单信息失败', duration: 3 });
      }
    })
    .finally(() => {
      hide();
      modalState.confirmLoading = false;
    });
}

/**
 * 打开新增或编辑弹窗
 * @param id - 菜单编号，有则为编辑模式
 * @param parent_id - 新增子菜单时的父菜单编号
 * @param parentType - 父菜单类型，用于推断可用的子菜单类型
 */
function handleEdit(
  id?: string | number,
  parent_id?: string | number,
  parentType?: string | number,
) {
  if (!id) {
    Object.assign(modalState.form, getDefaultForm());
    if (parent_id) {
      modalState.form.parent_id = parent_id;
      modalState.form.parentType = parentType;
    }
    modalState.title = '添加菜单信息';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getMenu(id)
      .then((res) => {
        if (isSuccess(res) && res.data) {
          Object.assign(modalState.form, res.data);
          modalState.title = '修改菜单信息';
          modalState.visibleByEdit = true;
        } else {
          message.error({ content: '获取菜单信息失败', duration: 3 });
        }
      })
      .finally(() => {
        hide();
        modalState.confirmLoading = false;
      });
  }
}

/** 关闭菜单详情/编辑弹窗 */
function handleCancel() {
  modalState.visibleByEdit = false;
  modalState.visibleByView = false;
}

/** 提交新增/编辑菜单 */
async function handleSubmit() {
  await submitExecute(toRaw(modalState.form));
}

/** 删除单个菜单（二次确认后执行） */
function handleDelete(id: string | number) {
  confirmAction({
    content: '确认删除菜单编号为【' + id + '】的数据项?',
    action: () => delMenu(id),
    variables: undefined,
    successText: '删除成功',
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

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="菜单名称" name="menu_name">
              <a-input v-model:value="queryParams.menu_name" allow-clear placeholder="请输入菜单名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="状态" name="menu_status">
              <a-select v-model:value="queryParams.menu_status" allow-clear placeholder="请选择菜单状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="handleQuery">
                  <template #icon>
                    <SearchOutlined />
                  </template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <template #title>
        <a-space :size="8" align="center">
          <a-button type="primary" @click.prevent="handleEdit()" v-perms:has="['system:menu:add']">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>
        </a-space>
      </template>

      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>展开/折叠</template>
            <a-switch v-model:checked="expandedRowAll" checked-children="展" un-checked-children="折" size="small"
              @change="handleExpandAll" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch v-model:checked="tableState.searched" checked-children="显" un-checked-children="隐" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch v-model:checked="tableState.striped" checked-children="开" un-checked-children="关" size="small" />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList">
              <template #icon>
                <ReloadOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon>
                  <ColumnHeightOutlined />
                </template>
              </a-button>
              <template #overlay>
                <a-menu :selected-keys="[tableState.size as string]" @click="setTableSize">
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
      <a-table class="antdv-table" row-key="id" :columns="tableColumns" :loading="loading" :data-source="treeTableData"
        :size="tableState.size" :row-class-name="rowClassName" :pagination="false" :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }" children-column-name="children" :expanded-row-keys="expandedRowKeys"
        @expandedRowsChange="handleExpandedRowsChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'menu_icon'">
            <IconFont :type="record.menu_icon" style="font-size: 18px"></IconFont>
          </template>
          <template v-if="column.key === 'menu_visible'">
            <a-tag :color="+record.menu_visible ? 'processing' : 'warning'">
              {{ ['隐藏', '显示'][+record.menu_visible] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'menu_status'">
            <DictTag :options="dict.sysNormalDisable" :value="record.menu_status" />
          </template>
          <template v-if="column.key === 'id'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.id)" v-perms:has="['system:menu:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleEdit(record.id)" v-perms:has="['system:menu:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.id)" v-perms:has="['system:menu:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.menu_type !== MENU_TYPE_AUTH">
                <template #title>新增子菜单</template>
                <a-button type="link" @click.prevent="
                  handleEdit(
                    undefined,
                    record.id,
                    record.menu_type
                  )
                  " v-perms:has="['system:menu:add']">
                  <template #icon>
                    <PlusOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal :drag="true" :width="800" :open="modalState.visibleByView" :title="modalState.title"
      @cancel="handleCancel">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单编号" name="id">
              {{ modalState.form.id }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="create_time">
              <span v-if="+modalState.form.create_time > 0">
                {{ parseDateToStr(+modalState.form.create_time) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="上级菜单" name="parent_id" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select :value="modalState.form.parent_id" placeholder="上级菜单" disabled :tree-data="treeDataAll"
            :field-names="{
              children: 'children',
              label: 'menu_name',
              value: 'id',
            }" tree-node-label-prop="menu_name">
            <template #suffixIcon></template>
          </a-tree-select>
        </a-form-item>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单名称" name="menu_name">
              {{ modalState.form.menu_name }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单排序" name="menu_sort">
              {{ modalState.form.menu_sort }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="菜单类型" name="menu_type" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tag v-if="modalState.form.menu_type === MENU_TYPE_DIR" color="purple">
            目录
          </a-tag>
          <a-tag v-if="modalState.form.menu_type === MENU_TYPE_MENU" color="cyan">
            菜单
          </a-tag>
          <a-tag v-if="modalState.form.menu_type === MENU_TYPE_AUTH" color="orange">
            权限
          </a-tag>
        </a-form-item>

        <a-row v-if="modalState.form.menu_type !== MENU_TYPE_AUTH">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单图标" name="menu_icon">
              <IconFont :type="modalState.form.menu_icon || '#'" style="font-size: 18px"></IconFont>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="路由地址" name="menu_path">
              {{ modalState.form.menu_path }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row v-if="modalState.form.menu_type !== MENU_TYPE_AUTH">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="是否外链" name="menu_external">
              <a-tag color="default">
                {{ ['否', '是'][+modalState.form.menu_external] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="页面缓存" name="menu_cache">
              <a-tag color="default">
                {{ ['不缓存', '缓存'][+modalState.form.menu_cache] }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示状态" name="menu_visible">
              <a-tag color="default">
                {{ ['隐藏', '显示'][+modalState.form.menu_visible] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单状态" name="menu_status">
              <DictTag :options="dict.sysNormalDisable" :value="modalState.form.menu_status" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="组件路径" name="menu_component" :label-col="{ span: 3 }" :label-wrap="true"
          v-if="modalState.form.menu_type === MENU_TYPE_MENU">
          {{ modalState.form.menu_component }}
        </a-form-item>

        <a-form-item label="权限标识" name="menu_perms" :label-col="{ span: 3 }" :label-wrap="true"
          v-if="modalState.form.menu_type !== MENU_TYPE_DIR">
          {{ modalState.form.menu_perms }}
        </a-form-item>

        <a-form-item label="菜单说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea :value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="modalState.visibleByEdit" :title="modalState.title" :confirm-loading="isSubmitting" @ok="handleSubmit"
      @cancel="handleCancel">
      <a-form name="modalStateForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-form-item label="上级菜单" name="parent_id" v-bind="modalStateForm.validateInfos.parent_id"
          :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select v-model:value="modalState.form.parent_id" placeholder="上级菜单" show-search tree-default-expand-all
            :tree-data="treeDataAll" :field-names="{
              children: 'children',
              label: 'menu_name',
              value: 'id',
            }" tree-node-label-prop="menu_name" tree-node-filter-prop="menu_name" style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }" @change="handleTreeDataChange">
          </a-tree-select>
        </a-form-item>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单名称" name="menu_name" v-bind="modalStateForm.validateInfos.menu_name">
              <a-input v-model:value="modalState.form.menu_name" allow-clear placeholder="请输入菜单名称"
                :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单排序" name="menu_sort">
              <a-input-number v-model:value="modalState.form.menu_sort" :min="0" :max="9999" :step="1"
                placeholder="排序值"></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="菜单类型" name="menu_type" :label-col="{ span: 3 }" :label-wrap="true">
          <a-radio-group v-model:value="modalState.form.menu_type">
            <a-radio :key="MENU_TYPE_DIR" :value="MENU_TYPE_DIR"
              :disabled="modalState.form.parentType === MENU_TYPE_MENU">
              目录
            </a-radio>
            <a-radio :key="MENU_TYPE_MENU" :value="MENU_TYPE_MENU"
              :disabled="modalState.form.parentType === MENU_TYPE_MENU">
              菜单
            </a-radio>
            <a-radio :key="MENU_TYPE_AUTH" :value="MENU_TYPE_AUTH">
              权限
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <a-row>
          <template v-if="modalState.form.menu_type !== MENU_TYPE_AUTH">
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="菜单图标" name="menu_icon">
                <a-select v-model:value="modalState.form.menu_icon" placeholder="请选择菜单图标" show-search
                  option-filter-prop="label" option-label-prop="label" :options="icons">
                  <template #suffixIcon>
                    <IconFont :type="modalState.form.menu_icon"></IconFont>
                  </template>
                  <template #option="{ value, label }">
                    <div style="font-size: 18px">
                      <IconFont :type="value"></IconFont>
                      &nbsp;&nbsp;{{ label }}
                    </div>
                  </template>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="路由地址" name="menu_path" v-bind="modalStateForm.validateInfos.menu_path">
                <a-input v-model:value="modalState.form.menu_path" allow-clear placeholder="请输入路由地址" :maxlength="200">
                  <template #prefix>
                    <a-tooltip placement="topLeft">
                      <template #title>
                        <div>
                          访问的路由地址，如：user、/auth
                          <br />
                          1. 如网络地址需内部访问<br />则以 http(s):// 开头
                          <br />菜单行为（根节点）：当前窗口打开
                          <br />菜单行为（非根节点）：内嵌窗口
                          <br />
                          2. 如网络地址需外部访问<br />则将是否外链选项设为否
                          <br />菜单行为：打开新标签
                          <br />
                          3. 如内嵌子页面需要隐藏页面<br />则将显示状态选项设为隐藏
                          <br />地址拼接以内嵌路由地址
                          {{ MENU_PATH_INLINE }}/子页面地址
                        </div>
                      </template>
                      <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                    </a-tooltip>
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="显示状态" name="menu_visible">
                <a-select v-model:value="modalState.form.menu_visible" default-value="0" placeholder="显示状态">
                  <a-select-option key="0" value="0">隐藏</a-select-option>
                  <a-select-option key="1" value="1">显示</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </template>

          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单状态" name="menu_status">
              <a-select v-model:value="modalState.form.menu_status" default-value="0" placeholder="菜单状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>

          <template v-if="modalState.form.menu_type === MENU_TYPE_MENU">
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="是否外链" name="menu_external">
                <a-select v-model:value="modalState.form.menu_external" default-value="0" placeholder="是否外链">
                  <a-select-option key="0" value="0">否</a-select-option>
                  <a-select-option key="1" value="1">是</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="页面缓存" name="menu_cache">
                <a-select v-model:value="modalState.form.menu_cache" default-value="0" placeholder="页面缓存">
                  <a-select-option key="0" value="0">不缓存</a-select-option>
                  <a-select-option key="1" value="1">缓存</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </template>
        </a-row>

        <a-form-item label="组件路径" name="menu_component" v-bind="modalStateForm.validateInfos.menu_component"
          :label-col="{ span: 3 }" :label-wrap="true" v-if="modalState.form.menu_type === MENU_TYPE_MENU">
          <a-input v-model:value="modalState.form.menu_component" allow-clear placeholder="请输入组件路径" :maxlength="200">
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    页面组件目录 views <br />
                    访问的组件路径,如：system/user/index <br />
                    注意：不带 .vue 文件后缀 <br />
                    路由地址是网络地址可填入链接
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="权限标识" name="menu_perms" v-bind="modalStateForm.validateInfos.menu_perms" :label-col="{ span: 3 }"
          :label-wrap="true" v-if="modalState.form.menu_type !== MENU_TYPE_DIR">
          <a-input v-model:value="modalState.form.menu_perms" allow-clear placeholder="请输入权限标识" :maxlength="100">
            <template #prefix>
              <a-tooltip placement="topLeft">
                <template #title>
                  <div>
                    权限标识示例：monitor:server:query
                  </div>
                </template>
                <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="菜单说明" name="remark" :label-col="{ span: 3 }" :label-wrap="true">
          <a-textarea v-model:value="modalState.form.remark" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="200"
            :show-count="true" placeholder="请输入菜单说明" />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.antdv-table :deep(.antdv-striped) td {
  background-color: #fafafa;
}
</style>
