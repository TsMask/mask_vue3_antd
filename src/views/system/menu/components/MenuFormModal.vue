<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import { ProModal } from 'antdv-pro-modal';
import { message } from 'ant-design-vue';
import IconFont from '@/components/IconFont/index.vue';
import { iconFonts } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
import { addMenu, getMenu, updateMenu } from '@/api/system/menu';
import { parseDateToStr } from '@/utils/date-utils';
import {
  MENU_PATH_INLINE,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
  MENU_TYPE_AUTH,
} from '@/constants/menu-constants';
import { useDictSetup } from '@/hooks/useDictSetup';
import { useModalForm } from '@/hooks/useModalForm';
import { useModalAction } from '@/hooks/useModalAction';

const props = defineProps<{
  menuTreeData: Record<string, any>[];
  menuList: Record<string, any>[];
}>();
const emit = defineEmits<{ success: [] }>();
const icons = reactive(iconFonts.map(item => ({ value: item, label: item })));

const { dict } = useDictSetup({
  keyMap: {
    sysNormalDisable: 'sys_normal_disable',
    sysShowHide: 'sys_show_hide',
  },
});

/** 新增时的默认值；parentType 仅用于控制类型可选项，不提交给接口。 */
function createDefaultForm() {
  return {
    id: undefined as string | number | undefined,
    parent_id: 0 as string | number,
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
    parentType: '' as string | number | undefined,
  };
}

const { modal, formCtl, isView, openModal, closeModal } = useModalForm({
  initForm: createDefaultForm,
  rules: {
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
  },
});

const { executeAction, loading: submitting } = useModalAction();

/** 上级菜单决定子菜单默认类型：目录下是菜单，菜单下是权限。 */
function handleTreeDataChange(value: string | number) {
  if (!value) return;
  const menu = props.menuList.find(item => item.id === value);
  if (!menu) return;

  if (menu.menu_type === MENU_TYPE_DIR) {
    modal.form.menu_type = MENU_TYPE_MENU;
  }
  if (menu.menu_type === MENU_TYPE_MENU) {
    modal.form.menu_type = MENU_TYPE_AUTH;
  }
  modal.form.parentType = menu.menu_type;
}

function openView(id: string | number) {
  if (!id) {
    message.error({ content: '获取菜单信息失败', duration: 3 });
    return;
  }

  openModal({
    mode: 'view',
    title: '菜单信息',
    fetchDetail: () => getMenu(id),
    errorMessage: '获取菜单信息失败',
  });
}

/** 有 id 打开编辑；无 id 时可带上父菜单和父类型直接新建子节点 */
function openEdit(
  id?: string | number,
  parent_id?: string | number,
  parentType?: string | number
) {
  if (!id) {
    openModal({
      mode: 'add',
      title: '添加菜单信息',
      beforeOpen(form) {
        if (!parent_id) return;
        form.parent_id = parent_id;
        form.parentType = parentType;
      },
    });
    return;
  }

  openModal({
    mode: 'edit',
    title: '修改菜单信息',
    fetchDetail: () => getMenu(id),
    errorMessage: '获取菜单信息失败',
  });
}

/** 提交前剥离响应式代理，并按已有 id 区分新增或修改 */
async function handleSubmit() {
  const form = toRaw(modal.form);
  await executeAction({
    action: () => (form.id ? updateMenu(form) : addMenu(form)),
    successText: '操作成功',
    onSuccess: () => {
      closeModal();
      emit('success');
    },
  });
}

defineExpose({ openView, openEdit });
</script>

<template>
  <ProModal
    :drag="true"
    :destroyOnClose="true"
    :width="800"
    :keyboard="!isView"
    :mask-closable="isView"
    :open="modal.visible"
    :title="modal.title"
    :confirm-loading="submitting"
    :footer="isView ? null : undefined"
    @ok="handleSubmit"
    @cancel="closeModal"
  >
    <a-form
      name="formCtlByMenuEdit"
      layout="horizontal"
      :label-col="{ span: 6 }"
      :label-wrap="true"
      :disabled="isView"
    >
      <a-row v-if="isView">
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="菜单编号" name="id">
            {{ modal.form.id }}
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="创建时间" name="create_time">
            <span v-if="+modal.form.create_time > 0">
              {{ parseDateToStr(+modal.form.create_time) }}
            </span>
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="上级菜单"
        name="parent_id"
        v-bind="formCtl.validateInfos.parent_id"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-tree-select
          v-model:value="modal.form.parent_id"
          placeholder="上级菜单"
          show-search
          tree-default-expand-all
          :tree-data="menuTreeData"
          :field-names="{
            children: 'children',
            label: 'menu_name',
            value: 'id',
          }"
          tree-node-label-prop="menu_name"
          tree-node-filter-prop="menu_name"
          style="width: 100%"
          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          @change="handleTreeDataChange"
        />
      </a-form-item>
      <a-row>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item
            label="菜单名称"
            name="menu_name"
            v-bind="formCtl.validateInfos.menu_name"
          >
            <a-input
              v-model:value="modal.form.menu_name"
              allow-clear
              placeholder="请输入菜单名称"
              :maxlength="50"
            />
          </a-form-item>
        </a-col>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="菜单排序" name="menu_sort">
            <a-input-number
              v-model:value="modal.form.menu_sort"
              :min="0"
              :max="9999"
              :step="1"
              placeholder="排序值"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item
        label="菜单类型"
        name="menu_type"
        :label-col="{ span: 3 }"
        :label-wrap="true"
      >
        <a-radio-group v-model:value="modal.form.menu_type">
          <a-radio
            :key="MENU_TYPE_DIR"
            :value="MENU_TYPE_DIR"
            :disabled="modal.form.parentType === MENU_TYPE_MENU"
          >
            目录
          </a-radio>
          <a-radio
            :key="MENU_TYPE_MENU"
            :value="MENU_TYPE_MENU"
            :disabled="modal.form.parentType === MENU_TYPE_MENU"
          >
            菜单
          </a-radio>
          <a-radio :key="MENU_TYPE_AUTH" :value="MENU_TYPE_AUTH">
            权限
          </a-radio>
        </a-radio-group>
      </a-form-item>
      <a-row>
        <template v-if="modal.form.menu_type !== MENU_TYPE_AUTH">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="菜单图标" name="menu_icon">
              <a-select
                v-model:value="modal.form.menu_icon"
                placeholder="请选择菜单图标"
                show-search
                option-filter-prop="label"
                option-label-prop="label"
                :options="icons"
              >
                <template #suffixIcon>
                  <IconFont :type="modal.form.menu_icon" />
                </template>
                <template #option="{ value, label }">
                  <div style="font-size: 18px">
                    <IconFont :type="value" />
                    &nbsp;&nbsp;{{ label }}
                  </div>
                </template>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="路由地址"
              name="menu_path"
              v-bind="formCtl.validateInfos.menu_path"
            >
              <a-input
                v-model:value="modal.form.menu_path"
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
              <a-select
                v-model:value="modal.form.menu_visible"
                default-value="0"
                placeholder="显示状态"
                :options="dict.sysShowHide"
              />
            </a-form-item>
          </a-col>
        </template>
        <a-col :lg="12" :md="12" :xs="24">
          <a-form-item label="菜单状态" name="menu_status">
            <a-select
              v-model:value="modal.form.menu_status"
              default-value="0"
              placeholder="菜单状态"
              :options="dict.sysNormalDisable"
            />
          </a-form-item>
        </a-col>
        <template v-if="modal.form.menu_type === MENU_TYPE_MENU">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="是否外链" name="menu_external">
              <a-select
                v-model:value="modal.form.menu_external"
                default-value="0"
                placeholder="是否外链"
              >
                <a-select-option key="0" value="0">否</a-select-option>
                <a-select-option key="1" value="1">是</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="页面缓存" name="menu_cache">
              <a-select
                v-model:value="modal.form.menu_cache"
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
        name="menu_component"
        v-bind="formCtl.validateInfos.menu_component"
        :label-col="{ span: 3 }"
        :label-wrap="true"
        v-if="modal.form.menu_type === MENU_TYPE_MENU"
      >
        <a-input
          v-model:value="modal.form.menu_component"
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
        name="menu_perms"
        v-bind="formCtl.validateInfos.menu_perms"
        :label-col="{ span: 3 }"
        :label-wrap="true"
        v-if="modal.form.menu_type !== MENU_TYPE_DIR"
      >
        <a-input
          v-model:value="modal.form.menu_perms"
          allow-clear
          placeholder="请输入权限标识"
          :maxlength="100"
        >
          <template #prefix>
            <a-tooltip placement="topLeft">
              <template #title>
                <div>权限标识示例：monitor:server:query</div>
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
          v-model:value="modal.form.remark"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="200"
          :show-count="true"
          placeholder="请输入菜单说明"
        />
      </a-form-item>
    </a-form>
  </ProModal>
</template>
