<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, reactive, computed, toRaw, watch } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Form } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import {
  listDept,
  getDept,
  delDept,
  addDept,
  updateDept,
  listDeptExcludeChild,
} from '@/api/system/dept';
import { parseDateToStr } from '@/utils/date-utils';
import { regExpMobile, regExpEmail } from '@/utils/regular-utils';
import { parseDataToTree } from '@/utils/parse-tree-utils';
import { isSuccess } from '@/plugins/http-fetch';
import { useTableUI } from '@/hooks/useTableUI';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useListQuery } from '@/hooks/useListQuery';
import { useAction, confirmAction } from '@/hooks/useAction';

const route = useRoute();
/** 路由标题 */
const title = ref<string>(route.meta.title ?? '标题');

/** 字典数据初始化 */
const { dict } = useDictSetup({ keyMap: { sysNormalDisable: 'sys_normal_disable', } });

/** 查询参数 */
const { queryParams, handleQuery, resetQuery } = useQueryParams({
  deptName: '',
  statusFlag: undefined as string | undefined,
}, () => { fetchList(); });

/** 表格UI状态 */
const { tableState, setTableSize, rowClassName } = useTableUI();

/** 树表格额外状态：展开行、全部展开标记 */
const expandedRowAll = ref(false);
const expandedRowKeys: (string | number)[] = reactive([]);

/** 全部展开时的key列表 */
let globalExpandedKeys: (string | number)[] = [];

/** 列表数据查询 */
const { listData, loading, fetch: fetchList } = useListQuery({
  queryFn: () => listDept(toRaw(queryParams)),
});

/** 解析为树结构（响应式，listData 变化自动重算） */
const treeData = computed(() => parseDataToTree(listData.value, 'deptId'));

/** 弹窗表单中的上级部门树 */
const treeDataForModal = computed(() => treeData.value);

/** 首次加载后初始化展开状态 */
watch(listData, (newData) => {
  if (newData.length > 0 && globalExpandedKeys.length === 0) {
    globalExpandedKeys = [...new Set(newData.map((item: any) => item.parentId))];
    expandedRowKeys.length = 0;
    expandedRowKeys.push(...globalExpandedKeys);
    handleToggleExpandAll(expandedRowAll.value);
  }
}, { once: true });

/** 表格字段列 */
const tableColumns: ColumnsType = [
  { title: '部门名称', dataIndex: 'deptName', align: 'left', width: 200 },
  { title: '部门编号', dataIndex: 'deptId', align: 'left', width: 100 },
  { title: '部门排序', dataIndex: 'deptSort', align: 'left', width: 100 },
  {
    title: '部门状态', dataIndex: 'statusFlag', key: 'statusFlag', align: 'left', width: 100,
  },
  {
    title: '创建时间', dataIndex: 'createTime', align: 'left', width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  { title: '操作', key: 'deptId', align: 'left' },
];

/** 表格展开/折叠控制 */
function handleToggleExpandAll(checked: boolean | string | number) {
  if (checked) {
    expandedRowKeys.length = 0;
    expandedRowKeys.push(...globalExpandedKeys);
  } else {
    expandedRowKeys.length = 0;
  }
}

/** 表格展开行变化回调 */
function handleExpandedRowsChange(expandedRows: (string | number)[]) {
  expandedRowKeys.length = 0;
  expandedRowKeys.push(...expandedRows);
}

// ==================== 弹窗状态 ====================

const modalVisibleByView = ref(false);
const modalVisibleByEdit = ref(false);
const modalTitle = ref('部门');
const modalConfirmLoading = ref(false);
const modalTreeData = reactive<Record<string, any>[]>([]);

/** 表单数据 */
const modalForm = reactive({
  deptId: undefined as string | number | undefined,
  deptName: '',
  email: '',
  leader: '',
  deptSort: 0,
  parentId: 100 as string | number,
  ancestors: '',
  phone: '',
  statusFlag: '0',
});

/** 表单校验规则 */
const modalFormCtl = Form.useForm(
  modalForm,
  reactive({
    parentId: [{ required: true, message: '上级部门不能为空' }],
    deptName: [{ required: true, min: 1, max: 50, message: '请正确输入部门名称' }],
    email: [{ required: false, pattern: regExpEmail, message: '请输入正确的邮箱地址' }],
    phone: [{ required: false, pattern: regExpMobile, message: '请输入正确的手机号码' }],
  }),
);

/** 新增/编辑操作 */
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form: any) => form.deptId ? updateDept(form) : addDept(form),
  successText: '操作成功',
  onSuccess() {
    handleCloseModal();
    fetchList()
  }
});

/** 打开详情弹窗 */
async function handleView(deptId: string | number) {
  if (!deptId || modalConfirmLoading.value) return;
  modalConfirmLoading.value = true;
  const hide = message.loading('正在打开...', 0);
  try {
    const res = await getDept(deptId);
    if (isSuccess(res) && res.data) {
      if (res.data.parentId === 0) {
        Object.assign(modalTreeData, [{ deptId: 0, parentId: 0, deptName: '根节点' }]);
      } else {
        Object.assign(modalTreeData, treeDataForModal.value);
      }
      Object.assign(modalForm, res.data);
      modalTitle.value = '部门信息';
      modalVisibleByView.value = true;
    }
  } finally {
    hide();
    modalConfirmLoading.value = false;
  }
}

/** 打开新增/编辑弹窗 */
async function handleOpenEdit(deptId?: string | number, parentId?: string | number) {
  if (!deptId) {
    modalFormCtl.resetFields();
    if (parentId) modalForm.parentId = parentId;
    Object.assign(modalTreeData, treeDataForModal.value);
    modalTitle.value = '添加部门信息';
    modalVisibleByEdit.value = true;
  } else {
    if (modalConfirmLoading.value) return;
    modalConfirmLoading.value = true;
    const hide = message.loading('正在打开...', 0);
    try {
      const [deptRes, excludeRes] = await Promise.all([
        getDept(deptId),
        listDeptExcludeChild(deptId),
      ]);
      if (isSuccess(deptRes) && deptRes.data) {
        Object.assign(modalForm, deptRes.data);
        if (isSuccess(excludeRes) && Array.isArray(excludeRes.data)) {
          if (excludeRes.data.length === 0) {
            Object.assign(modalTreeData, [{ deptId: 0, parentId: 0, deptName: '根节点' }]);
          } else {
            Object.assign(modalTreeData, parseDataToTree(excludeRes.data, 'deptId'));
          }
        }
        modalTitle.value = '修改部门信息';
        modalVisibleByEdit.value = true;
      }
    } finally {
      hide();
      modalConfirmLoading.value = false;
    }
  }
}

/** 表单提交确认 */
async function handleSubmit() {
  try {
    await modalFormCtl.validate();
  } catch (e: any) {
    message.error({ content: `请正确填写 ${e.errorFields.length} 处必填信息！`, duration: 3 });
    return;
  }
  await submitExecute(toRaw(modalForm));
}

/** 关闭弹窗 */
function handleCloseModal() {
  modalVisibleByEdit.value = false;
  modalVisibleByView.value = false;
  modalFormCtl.resetFields();
}

/** 删除部门 */
function handleDelete(deptId: string | number) {
  confirmAction({
    content: `确认删除部门编号为 【${deptId}】 的数据项?`,
    action: () => delDept(deptId),
    variables: undefined,
    successText: '删除成功',
    onSuccess: () => fetchList(),
  });
}
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph> 给予用户部门标记 </a-typography-paragraph>
    </template>

    <a-card v-show="tableState.searched" :bordered="false" :body-style="{ marginBottom: '24px', paddingBottom: 0 }">
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="部门名称" name="deptName">
              <a-input v-model:value="queryParams.deptName" allow-clear placeholder="请输入部门名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="部门状态" name="statusFlag">
              <a-select v-model:value="queryParams.statusFlag" allow-clear placeholder="请选择"
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
          <a-button type="primary" @click.prevent="handleOpenEdit()" v-perms:has="['system:dept:add']">
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
              @change="handleToggleExpandAll" />
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

      <a-table class="antdv-table" row-key="deptId" :columns="tableColumns" :loading="loading" :data-source="treeData"
        :size="tableState.size" :row-class-name="rowClassName" :pagination="false"
        :scroll="{ x: tableColumns.length * 120, scrollToFirstRowOnChange: true }" children-column-name="children"
        :expanded-row-keys="expandedRowKeys" @expandedRowsChange="handleExpandedRowsChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'statusFlag'">
            <DictTag :options="dict.sysNormalDisable" :value="record.statusFlag" />
          </template>
          <template v-if="column.key === 'deptId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button type="link" @click.prevent="handleView(record.deptId)" v-perms:has="['system:dept:query']">
                  <template #icon>
                    <ProfileOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button type="link" @click.prevent="handleOpenEdit(record.deptId)" v-perms:has="['system:dept:edit']">
                  <template #icon>
                    <FormOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.parentId !== 0">
                <template #title>删除</template>
                <a-button type="link" @click.prevent="handleDelete(record.deptId)" v-perms:has="['system:dept:remove']">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight" v-if="record.statusFlag !== '0'">
                <template #title>新增子部门</template>
                <a-button type="link" @click.prevent="handleOpenEdit(undefined, record.deptId)"
                  v-perms:has="['system:dept:add']">
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
    <ProModal :drag="true" :width="800" :open="modalVisibleByView" :title="modalTitle" @cancel="handleCloseModal">
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-form-item label="部门编号" name="deptId" :label-col="{ span: 3 }" :label-wrap="true">
          {{ modalForm.deptId }}
        </a-form-item>
        <a-form-item label="上级部门" name="parentId" :label-col="{ span: 3 }" :label-wrap="true">
          <a-tree-select :value="modalForm.parentId" placeholder="上级部门" disabled :tree-data="modalTreeData"
            :field-names="{ children: 'children', label: 'deptName', value: 'deptId' }" tree-node-label-prop="deptName">
            <template #suffixIcon></template>
          </a-tree-select>
        </a-form-item>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="部门状态" name="statusFlag">
              <DictTag :options="dict.sysNormalDisable" :value="modalForm.statusFlag" />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示排序" name="deptSort">{{ modalForm.deptSort }}</a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="部门名称" name="deptName" :label-col="{ span: 3 }" :label-wrap="true">
          {{ modalForm.deptName }}
        </a-form-item>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="负责人" name="leader">{{ modalForm.leader }}</a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="联系电话" name="phone">{{ modalForm.phone }}</a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="邮箱" name="email">{{ modalForm.email }}</a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="handleCloseModal">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal :drag="true" :destroyOnClose="true" :width="800" :keyboard="false" :mask-closable="false"
      :open="modalVisibleByEdit" :title="modalTitle" :confirm-loading="isSubmitting" @ok="handleSubmit"
      @cancel="handleCloseModal">
      <a-form name="modalForm" layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-form-item label="上级部门" name="parentId" v-bind="modalFormCtl.validateInfos.parentId" :label-col="{ span: 3 }"
          :label-wrap="true">
          <a-tree-select v-model:value="modalForm.parentId" placeholder="上级部门" show-search tree-default-expand-all
            :tree-data="modalTreeData" :field-names="{ children: 'children', label: 'deptName', value: 'deptId' }"
            tree-node-label-prop="deptName" tree-node-filter-prop="deptName" style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }">
          </a-tree-select>
        </a-form-item>
        <a-form-item label="部门名称" name="deptName" v-bind="modalFormCtl.validateInfos.deptName" :label-col="{ span: 3 }"
          :label-wrap="true">
          <a-input v-model:value="modalForm.deptName" allow-clear :maxlength="50" placeholder="请输入部门名称"></a-input>
        </a-form-item>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="部门状态" name="statusFlag">
              <a-select v-model:value="modalForm.statusFlag" default-value="0" placeholder="部门状态"
                :options="dict.sysNormalDisable">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="显示顺序" name="deptSort">
              <a-input-number v-model:value="modalForm.deptSort" :min="0" :max="9999" :step="1"
                placeholder="排序值"></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="负责人" name="leader" v-bind="modalFormCtl.validateInfos.leader">
              <a-input v-model:value="modalForm.leader" allow-clear placeholder="请输入负责人名称" :maxlength="50"></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="联系电话" name="phone" v-bind="modalFormCtl.validateInfos.phone">
              <a-input v-model:value="modalForm.phone" allow-clear :maxlength="11" placeholder="请输入负责人联系电话"></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="邮箱" name="email" v-bind="modalFormCtl.validateInfos.email">
              <a-input v-model:value="modalForm.email" allow-clear :maxlength="40" placeholder="请输入负责人邮箱"></a-input>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.antdv-table :deep(.antdv-striped) td {
  background-color: #fafafa;
}
</style>