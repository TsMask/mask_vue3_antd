<script setup lang="ts">
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Form } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import IconFont from '@/components/IconFont/index.vue';
import { iconFonts } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { useRoute } from 'vue-router';
import { reactive, ref, toRaw, onMounted } from 'vue';
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
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
import { useTableUI } from '@/hooks/useTableUI';
import { useMessageAction } from '@/hooks/useMessageAction';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';

const route = useRoute();

const icons = reactive(iconFonts.map((item) => ({ value: item, label: item })));

const title = ref<string>(route.meta.title ?? '标题');

const { dict, loadDicts } = useDictSetup({
  sysNormalDisable: 'sys_normal_disable',
});

const { withLoading, confirmAndRun } = useMessageAction();

const { queryParams, resetQuery } = useQueryParams(
  { menuName: '', statusFlag: undefined as string | undefined },
  () => fetchList(),
);

const {
  tableState,
  setTableSize,
  rowClassName,
} = useTableUI();

tableState.seached = false;
const expandedRowKeysAll = ref<string[]>([]);
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

const tableColumns: ColumnsType = [
  { title: '菜单名称', dataIndex: 'menuName', align: 'left', width: 200 },
  { title: '菜单编号', dataIndex: 'menuId', align: 'left', width: 100 },
  { title: '菜单排序', dataIndex: 'menuSort', align: 'left', width: 100 },
  {
    title: '菜单图标',
    dataIndex: 'icon',
    key: 'icon',
    align: 'left',
    width: 100,
  },
  { title: '权限标识', dataIndex: 'perms', align: 'left', width: 200 },
  { title: '组件路径', dataIndex: 'component', align: 'left', width: 200 },
  {
    title: '显示状态',
    dataIndex: 'visibleFlag',
    key: 'visibleFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '菜单状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'left',
    width: 200,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  { title: '操作', key: 'menuId', align: 'left' },
];

let menuListData: Record<string, any>[] = [];
let treeDataAll: Record<string, any>[] = [];

const modalState = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '菜单',
  form: {} as Record<string, any>,
  confirmLoading: false,
  treeData: [] as Record<string, any>[],
});

const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    parentId: [{ required: true, message: '上级菜单不能为空' }],
    menuName: [
      { required: true, min: 1, max: 50, message: '请正确输入菜单名称' },
    ],
    component: [
      { required: true, min: 1, max: 200, message: '请正确输入组件路径' },
    ],
    menuPath: [
      { required: true, min: 1, max: 200, message: '请正确输入路由地址' },
    ],
    perms: [
      { required: true, min: 1, max: 100, message: '请正确输入权限标识' },
    ],
  })
);

/** 获取菜单表单默认值 */
function getDefaultForm() {
  return {
    menuId: undefined,
    parentId: 0,
    menuName: '',
    menuSort: 0,
    menuType: MENU_TYPE_AUTH,
    component: '',
    menuPath: '',
    icon: '#',
    perms: '',
    frameFlag: '1',
    cacheFlag: '0',
    visibleFlag: '0',
    statusFlag: '0',
    createTime: 0,
    remark: '',
    parentType: '',
  };
}

Object.assign(modalState.form, getDefaultForm());

/** 上级菜单选择变化时，自动推断子菜单类型（目录->菜单，菜单->权限） */
function handleTreeDataChange(value: any) {
  if (!value) return;
  const menu = menuListData.find((m) => m.menuId === value);
  if (!menu) return;
  if (menu.menuType === MENU_TYPE_DIR) {
    modalState.form.menuType = MENU_TYPE_MENU;
  }
  if (menu.menuType === MENU_TYPE_MENU) {
    modalState.form.menuType = MENU_TYPE_AUTH;
  }
  modalState.form.parentType = menu.menuType;
}

/** 打开菜单详情弹窗，根据 menuId 查询并展示数据 */
function handleView(menuId: string | number) {
  if (!menuId) {
    message.error({ content: '获取菜单信息失败', duration: 3 });
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  modalState.treeData = treeDataAll;
  getMenu(menuId)
    .then((res) => {
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
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
 * @param menuId - 菜单编号，有则为编辑模式
 * @param parentId - 新增子菜单时的父菜单编号
 * @param parentType - 父菜单类型，用于推断可用的子菜单类型
 */
function handleEdit(
  menuId?: string | number,
  parentId?: string | number,
  parentType?: string | number,
) {
  modalState.treeData = treeDataAll;
  if (!menuId) {
    Object.assign(modalState.form, getDefaultForm());
    if (parentId) {
      modalState.form.parentId = parentId;
      modalState.form.parentType = parentType;
    }
    modalState.title = '添加菜单信息';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getMenu(menuId)
      .then((res) => {
        if (res.code === RESULT_CODE_SUCCESS && res.data) {
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

/** 提交新增/编辑菜单，成功则清空树形缓存并刷新列表 */
async function handleSubmit() {
  modalState.confirmLoading = true;
  try {
    const form = toRaw(modalState.form);
    const res = await withLoading(
      (form.menuId ? updateMenu : addMenu)(form),
      { successText: modalState.title + '成功' },
    );
    if (res.code === RESULT_CODE_SUCCESS) {
      treeDataAll = [];
      fetchList();
      handleCancel();
    }
  } finally {
    modalState.confirmLoading = false;
  }
}

/** 删除单个菜单，操作前需二次确认 */
function handleDelete(menuId: string | number) {
  confirmAndRun({
    content: '确认删除菜单编号为【' + menuId + '】的数据项?',
    onOk: () => delMenu(menuId),
    successText: '删除成功',
    onSuccess: () => fetchList(),
  });
}

/** 查询菜单树形列表，首次加载时构建父节点树和展开键列表 */
function fetchList() {
  if (tableState.loading) return;
  tableState.loading = true;
  listMenu(toRaw(queryParams)).then((res) => {
    if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
      menuListData = JSON.parse(JSON.stringify(res.data));
      if (treeDataAll.length <= 0) {
        const data: Record<string, any>[] = JSON.parse(
          JSON.stringify(res.data),
        );
        treeDataAll = [
          {
            menuId: '0',
            menuName: '根节点',
            children: parseDataToTreeExclude(
              data,
              'menuType',
              MENU_TYPE_AUTH,
              'menuId',
            ),
          },
        ];
        expandedRowKeysAll.value = [
          ...new Set(data.map((item) => item.parentId)),
        ];
        handleExpandAll(expandedRowAll.value);
      }
      tableState.data = parseDataToTree(res.data, 'menuId');
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  loadDicts();
  fetchList();
});
</script>
﻿
<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        动态路由菜单，根节点下创建菜单会用使用菜单编号作为菜单目录路径。
      </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
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
            <a-form-item label="状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
                allow-clear
                placeholder="请选择菜单状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fetchList()">
                  <template #icon><SearchOutlined /></template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="resetQuery">
                  <template #icon><ClearOutlined /></template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <!-- 插槽-卡片左侧侧 -->
      <template #title>
        <a-space :size="8" align="center">
          <a-button
            type="primary"
            @click.prevent="handleEdit()"
            v-perms:has="['system:menu:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
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
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="显"
              un-checked-children="隐"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch
              v-model:checked="tableState.striped"
              checked-children="开"
              un-checked-children="关"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fetchList()">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon><ColumnHeightOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu
                  :selected-keys="[tableState.size as string]"
                  @click="setTableSize"
                >
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
        row-key="menuId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="rowClassName"
        :pagination="false"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        children-column-name="children"
        :expanded-row-keys="expandedRowKeys"
        @expandedRowsChange="handleExpandedRowsChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <IconFont :type="record.icon" style="font-size: 18px"></IconFont>
          </template>
          <template v-if="column.key === 'visibleFlag'">
            <a-tag :color="+record.visibleFlag ? 'processing' : 'warning'">
              {{ ['隐藏', '显示'][+record.visibleFlag] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'statusFlag'">
            <DictTag
              :options="dict.sysNormalDisable"
              :value="record.statusFlag"
            />
          </template>
          <template v-if="column.key === 'menuId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="handleView(record.menuId)"
                  v-perms:has="['system:menu:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="handleEdit(record.menuId)"
                  v-perms:has="['system:menu:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="handleDelete(record.menuId)"
                  v-perms:has="['system:menu:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip
                placement="topRight"
                v-if="record.menuType !== MENU_TYPE_AUTH"
              >
                <template #title>新增子菜单</template>
                <a-button
                  type="link"
                  @click.prevent="
                    handleEdit(
                      undefined,
                      record.menuId,
                      record.menuType
                    )
                  "
                  v-perms:has="['system:menu:add']"
                >
                  <template #icon><PlusOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal
      :drag="true"
      :width="800"
      :open="modalState.visibleByView"
      :title="modalState.title"
      @cancel="handleCancel"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单编号" name="menuId">
              {{ modalState.form.menuId }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="创建时间" name="createTime">
              <span v-if="+modalState.form.createTime > 0">
                {{ parseDateToStr(+modalState.form.createTime) }}
              </span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="上级菜单"
          name="parentId"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            :value="modalState.form.parentId"
            placeholder="上级菜单"
            disabled
            :tree-data="modalState.treeData"
            :field-names="{
              children: 'children',
              label: 'menuName',
              value: 'menuId',
            }"
            tree-node-label-prop="menuName"
          >
            <template #suffixIcon></template>
          </a-tree-select>
        </a-form-item>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单名称" name="menuName">
              {{ modalState.form.menuName }}
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单排序" name="menuSort">
              {{ modalState.form.menuSort }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="菜单类型"
          name="menuType"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tag
            v-if="modalState.form.menuType === MENU_TYPE_DIR"
            color="purple"
          >
            目录
          </a-tag>
          <a-tag
            v-if="modalState.form.menuType === MENU_TYPE_MENU"
            color="cyan"
          >
            菜单
          </a-tag>
          <a-tag
            v-if="modalState.form.menuType === MENU_TYPE_AUTH"
            color="orange"
          >
            权限
          </a-tag>
        </a-form-item>

        <a-row v-if="modalState.form.menuType !== MENU_TYPE_AUTH">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单图标" name="icon">
              <IconFont
                :type="modalState.form.icon || '#'"
                style="font-size: 18px"
              ></IconFont>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="路由地址" name="menuPath">
              {{ modalState.form.menuPath }}
            </a-form-item>
          </a-col>
        </a-row>

        <a-row v-if="modalState.form.menuType !== MENU_TYPE_AUTH">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="内部地址" name="frameFlag">
              <a-tag color="default">
                {{ ['否', '是'][+modalState.form.frameFlag] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="页面缓存" name="cacheFlag">
              <a-tag color="default">
                {{ ['不缓存', '缓存'][+modalState.form.cacheFlag] }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示状态" name="visibleFlag">
              <a-tag color="default">
                {{ ['隐藏', '显示'][+modalState.form.visibleFlag] }}
              </a-tag>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单状态" name="statusFlag">
              <DictTag
                :options="dict.sysNormalDisable"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="组件路径"
          name="component"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.form.menuType === MENU_TYPE_MENU"
        >
          {{ modalState.form.component }}
        </a-form-item>

        <a-form-item
          label="权限标识"
          name="perms"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.form.menuType !== MENU_TYPE_DIR"
        >
          {{ modalState.form.perms }}
        </a-form-item>

        <a-form-item
          label="菜单说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            :value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :disabled="true"
            style="color: rgba(0, 0, 0, 0.85)"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="false"
      :mask-closable="false"
      :open="modalState.visibleByEdit"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        name="modalStateForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-form-item
          label="上级菜单"
          name="parentId"
          v-bind="modalStateForm.validateInfos.parentId"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-tree-select
            v-model:value="modalState.form.parentId"
            placeholder="上级菜单"
            show-search
            tree-default-expand-all
            :tree-data="modalState.treeData"
            :field-names="{
              children: 'children',
              label: 'menuName',
              value: 'menuId',
            }"
            tree-node-label-prop="menuName"
            tree-node-filter-prop="menuName"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            @change="handleTreeDataChange"
          >
          </a-tree-select>
        </a-form-item>

        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="菜单名称"
              name="menuName"
              v-bind="modalStateForm.validateInfos.menuName"
            >
              <a-input
                v-model:value="modalState.form.menuName"
                allow-clear
                placeholder="请输入菜单名称"
                :maxlength="50"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单排序" name="menuSort">
              <a-input-number
                v-model:value="modalState.form.menuSort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="排序值"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="菜单类型"
          name="menuType"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-radio-group v-model:value="modalState.form.menuType">
            <a-radio
              :key="MENU_TYPE_DIR"
              :value="MENU_TYPE_DIR"
              :disabled="modalState.form.parentType === MENU_TYPE_MENU"
            >
              目录
            </a-radio>
            <a-radio
              :key="MENU_TYPE_MENU"
              :value="MENU_TYPE_MENU"
              :disabled="modalState.form.parentType === MENU_TYPE_MENU"
            >
              菜单
            </a-radio>
            <a-radio :key="MENU_TYPE_AUTH" :value="MENU_TYPE_AUTH">
              权限
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <a-row>
          <template v-if="modalState.form.menuType !== MENU_TYPE_AUTH">
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="菜单图标" name="icon">
                <a-select
                  v-model:value="modalState.form.icon"
                  placeholder="请选择菜单图标"
                  show-search
                  option-filter-prop="label"
                  option-label-prop="label"
                  :options="icons"
                >
                  <template #suffixIcon>
                    <IconFont :type="modalState.form.icon"></IconFont>
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
              <a-form-item
                label="路由地址"
                name="menuPath"
                v-bind="modalStateForm.validateInfos.menuPath"
              >
                <a-input
                  v-model:value="modalState.form.menuPath"
                  allow-clear
                  placeholder="请输入路由地址"
                  :maxlength="200"
                >
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
                          2. 如网络地址需外部访问<br />则将内部地址选项设为否
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
              <a-form-item label="显示状态" name="visibleFlag">
                <a-select
                  v-model:value="modalState.form.visibleFlag"
                  default-value="0"
                  placeholder="显示状态"
                >
                  <a-select-option key="0" value="0">隐藏</a-select-option>
                  <a-select-option key="1" value="1">显示</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </template>

          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="菜单状态"
                :options="dict.sysNormalDisable"
              >
              </a-select>
            </a-form-item>
          </a-col>

          <template v-if="modalState.form.menuType === MENU_TYPE_MENU">
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="内部地址" name="frameFlag">
                <a-select
                  v-model:value="modalState.form.frameFlag"
                  default-value="0"
                  placeholder="内部地址"
                >
                  <a-select-option key="0" value="0">否</a-select-option>
                  <a-select-option key="1" value="1">是</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :lg="12" :md="12" :xs="24">
              <a-form-item label="页面缓存" name="cacheFlag">
                <a-select
                  v-model:value="modalState.form.cacheFlag"
                  default-value="0"
                  placeholder="页面缓存"
                >
                  <a-select-option key="0" value="0">不缓存</a-select-option>
                  <a-select-option key="1" value="1">缓存</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </template>
        </a-row>

        <a-form-item
          label="组件路径"
          name="component"
          v-bind="modalStateForm.validateInfos.component"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.form.menuType === MENU_TYPE_MENU"
        >
          <a-input
            v-model:value="modalState.form.component"
            allow-clear
            placeholder="请输入组件路径"
            :maxlength="200"
          >
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

        <a-form-item
          label="权限标识"
          name="perms"
          v-bind="modalStateForm.validateInfos.perms"
          :label-col="{ span: 3 }"
          :label-wrap="true"
          v-if="modalState.form.menuType !== MENU_TYPE_DIR"
        >
          <a-input
            v-model:value="modalState.form.perms"
            allow-clear
            placeholder="请输入权限标识"
            :maxlength="100"
          >
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

        <a-form-item
          label="菜单说明"
          name="remark"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.remark"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            :maxlength="200"
            :show-count="true"
            placeholder="请输入菜单说明"
          />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}
</style>