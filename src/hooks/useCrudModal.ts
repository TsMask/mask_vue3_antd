import { computed, reactive } from 'vue';
import { Form, message } from 'ant-design-vue';
import { isSuccess, type ResultType } from '@/plugins/http-fetch';

/** 弹窗模式：view 详情只读 / add 新增 / edit 编辑 */
export type CrudModalMode = 'view' | 'add' | 'edit';

export interface UseCrudModalOptions<TForm> {
  /** 表单初始值工厂函数，每次打开新增弹窗时使用 */
  initForm: () => TForm;
  /** 表单校验规则（ant-design-vue Form.useForm 格式） */
  rules?: Record<string, any>;
}

/**
 * 通用 CRUD 弹窗管理（单弹窗 + 模式驱动）
 *
 * 设计：
 * - 一个弹窗承载 详情/新增/编辑 三种模式，页面只维护一份字段布局
 * - 详情模式 = 同一份表单的只读态（a-form :disabled="isView"）
 * - 新增/编辑共用一套控件与校验，仅标题与提交行为不同
 *
 * @example
 * ```ts
 * const { modal, formCtl, isView, openView, openEdit, close } = useCrudModal({
 *   initForm: () => ({ id: undefined, name: '' }),
 *   rules: { name: [{ required: true, message: '请输入名称' }] },
 * });
 *
 * // 详情（自动请求数据并以只读态打开）
 * openView(id, getApi, '详情');
 *
 * // 新增 / 编辑
 * openEdit(id, getApi, '新增', '编辑');
 *
 * // 自定义数据装填后手动打开（如 user 的 roles/posts 组装）
 * setForm(data);
 * open('view', '详情');
 * ```
 */
export function useCrudModal<TForm extends Record<string, any>>(
  options: UseCrudModalOptions<TForm>
) {
  const { initForm, rules } = options;

  /** 响应式弹窗状态 */
  const modal = reactive({
    /** 当前弹窗模式 */
    mode: 'add' as CrudModalMode,
    /** 弹窗是否可见 */
    visible: false,
    /** 弹窗标题 */
    title: '',
    /** 表单数据 */
    form: initForm(),
    /** 打开中/提交中的确认按钮 loading 状态 */
    confirmLoading: false,
  });

  /** 表单控制器（ant-design-vue Form.useForm） */
  const formCtl = Form.useForm(
    modal.form as Record<string, any>,
    rules ? reactive(rules) : undefined
  );

  /** 详情只读模式 */
  const isView = computed(() => modal.mode === 'view');
  /** 新增模式 */
  const isAdd = computed(() => modal.mode === 'add');
  /** 编辑模式 */
  const isEdit = computed(() => modal.mode === 'edit');

  /**
   * 设置表单数据（合并到现有表单）
   * @param data - 需要合并的数据对象
   */
  function setForm(data: Record<string, any>) {
    Object.assign(modal.form as Record<string, any>, data);
  }

  /**
   * 重置表单（清空校验状态和值）
   */
  function resetForm() {
    formCtl.resetFields();
  }

  /**
   * 以指定模式打开弹窗（数据由调用方准备）
   * @param mode - 弹窗模式
   * @param title - 弹窗标题
   */
  function open(mode: CrudModalMode, title: string) {
    modal.mode = mode;
    modal.title = title;
    modal.visible = true;
  }

  /**
   * 关闭弹窗并重置表单
   */
  function close() {
    modal.visible = false;
    resetForm();
  }

  /**
   * 打开详情弹窗（只读态）
   * 自动请求数据并赋值表单
   *
   * @param id - 数据 ID
   * @param fetchFn - 查询详情的 API 函数
   * @param title - 弹窗标题
   */
  async function openView(
    id: string | number,
    fetchFn: (id: string | number) => Promise<ResultType>,
    title: string
  ) {
    if (!id) return;
    modal.confirmLoading = true;
    const hide = message.loading('正在打开...', 0);
    try {
      const res = await fetchFn(id);
      if (isSuccess(res) && res.data) {
        Object.assign(modal.form as Record<string, any>, res.data);
        open('view', title);
      }
    } finally {
      hide();
      modal.confirmLoading = false;
    }
  }

  /**
   * 打开编辑弹窗（新增/编辑）
   * 新增时重置表单，编辑时自动请求数据并赋值
   *
   * @param id - 数据 ID，不传则为新增模式
   * @param fetchFn - 查询详情的 API 函数
   * @param addTitle - 新增时的弹窗标题
   * @param editTitle - 编辑时的弹窗标题
   */
  async function openEdit(
    id: string | number | undefined,
    fetchFn: (id: string | number) => Promise<ResultType>,
    addTitle: string,
    editTitle: string
  ) {
    const fetchId = id || 0;
    modal.confirmLoading = true;
    const hide = message.loading('正在打开...', 0);
    try {
      formCtl.resetFields();
      if (fetchId) {
        const res = await fetchFn(fetchId);
        if (isSuccess(res) && res.data) {
          Object.assign(modal.form as Record<string, any>, res.data);
          open('edit', editTitle);
        }
      } else {
        open('add', addTitle);
      }
    } finally {
      hide();
      modal.confirmLoading = false;
    }
  }

  return {
    modal,
    formCtl,
    isView,
    isAdd,
    isEdit,
    setForm,
    resetForm,
    open,
    close,
    openView,
    openEdit,
  };
}
