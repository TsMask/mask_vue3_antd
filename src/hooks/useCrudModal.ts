import { reactive, toRaw } from "vue";
import { message, Form } from "ant-design-vue";
import { RESULT_CODE_SUCCESS } from "@/constants/result-constants";

export interface UseCrudModalOptions<TForm> {
  /** 表单初始值工厂函数，每次打开新增弹窗时使用 */
  initForm: () => TForm;
  /** 表单校验规则（ant-design-vue Form.useForm 格式） */
  rules?: Record<string, any>;
}

/**
 * 通用 CRUD 弹窗管理 hook
 *
 * 解决的问题：
 * - 各页面重复定义 ModalStateType 类型和 modalState reactive 对象
 * - 各页面重复编写 fnModalVisibleByVive / fnModalVisibleByEdit / fnModalOk / fnModalCancel
 * - 弹窗打开时的 loading 状态、表单赋值、错误提示逻辑重复
 * - Form.useForm 的初始化和 validate/resetFields 调用重复
 *
 * @example
 * ```ts
 * const { modal, formCtl, openView, openEdit, close } = useCrudModal({
 *   initForm: () => ({ id: undefined, name: '', status: '0' }),
 *   rules: { name: [{ required: true, message: '请输入名称' }] },
 * });
 *
 * // 查看详情
 * openView(record.id, getApi, '详情信息');
 *
 * // 新增/编辑
 * openEdit(record.id, getApi, '新增', '编辑');
 * ```
 *
 * @param options - 配置选项（表单初始值、校验规则）
 * @returns modal - 响应式弹窗状态（visibleByView/visibleByEdit/title/form/confirmLoading）
 * @returns formCtl - Form.useForm 返回的表单控制器（validate/resetFields/validateInfos）
 * @returns setForm - 设置表单数据（合并到 modal.form）
 * @returns resetForm - 重置表单校验状态和值
 * @returns close - 关闭弹窗并重置表单
 * @returns openView - 打开详情弹窗（调用 API 获取数据）
 * @returns openEdit - 打开编辑弹窗（无 id 时为新增模式）
 */
export function useCrudModal<TForm extends Record<string, any>>(
  options: UseCrudModalOptions<TForm>,
) {
  const { initForm, rules } = options;

  /** 响应式弹窗状态 */
  const modal = reactive({
    /** 详情弹窗是否可见 */
    visibleByView: false,
    /** 编辑弹窗是否可见 */
    visibleByEdit: false,
    /** 弹窗标题 */
    title: "",
    /** 表单数据 */
    form: initForm(),
    /** 确定按钮 loading 状态 */
    confirmLoading: false,
  });

  /** 表单控制器（ant-design-vue Form.useForm） */
  const formCtl = Form.useForm(
    modal.form as Record<string, any>,
    rules ? reactive(rules) : undefined,
  );

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
   * 关闭弹窗并重置表单
   */
  function close() {
    modal.visibleByEdit = false;
    modal.visibleByView = false;
    resetForm();
  }

  /**
   * 打开详情弹窗
   * 自动调用 API 获取数据，显示 loading 状态
   *
   * @param id - 数据 ID
   * @param fetch - 获取数据的 API 函数
   * @param title - 弹窗标题
   */
  async function openView(
    id: string | number | undefined,
    fetch: (id: string | number) => Promise<any>,
    title: string,
  ) {
    if (!id) {
      message.error({ content: "获取信息失败", duration: 3 });
      return;
    }
    if (modal.confirmLoading) return;

    const hide = message.loading("正在打开...", 0);
    modal.confirmLoading = true;

    try {
      const res = await fetch(id);
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        setForm(res.data);
        modal.title = title;
        modal.visibleByView = true;
      } else {
        message.error({ content: "获取信息失败", duration: 3 });
      }
    } finally {
      hide();
      modal.confirmLoading = false;
    }
  }

  /**
   * 打开编辑弹窗
   * 无 id 时为新增模式（重置表单），有 id 时为编辑模式（调用 API 获取数据）
   *
   * @param id - 数据 ID（可选，为空时为新增模式）
   * @param fetch - 获取数据的 API 函数
   * @param createTitle - 新增时的弹窗标题
   * @param editTitle - 编辑时的弹窗标题
   */
  async function openEdit(
    id: string | number | undefined,
    fetch: (id: string | number) => Promise<any>,
    createTitle: string,
    editTitle: string,
  ) {
    if (!id) {
      resetForm();
      modal.title = createTitle;
      modal.visibleByEdit = true;
      return;
    }

    if (modal.confirmLoading) return;

    const hide = message.loading("正在打开...", 0);
    modal.confirmLoading = true;

    try {
      const res = await fetch(id);
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        setForm(res.data);
        modal.title = editTitle;
        modal.visibleByEdit = true;
      } else {
        message.error({ content: "获取信息失败", duration: 3 });
      }
    } finally {
      hide();
      modal.confirmLoading = false;
    }
  }

  return {
    modal,
    formCtl,
    setForm,
    resetForm,
    close,
    openView,
    openEdit,
  };
}
