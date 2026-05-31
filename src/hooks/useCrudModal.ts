import { reactive } from 'vue';
import { Form } from 'ant-design-vue';

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
 * const { modal, formCtl, setForm, resetForm, close } = useCrudModal({
 *   initForm: () => ({ id: undefined, name: '', status: '0' }),
 *   rules: { name: [{ required: true, message: '请输入名称' }] },
 * });
 *
 * // 新增
 * modal.title = '新增';
 * resetForm();
 * modal.visibleByEdit = true;
 *
 * // 编辑
 * const data = await getApi(id);
 * setForm(data);
 * modal.title = '编辑';
 * modal.visibleByEdit = true;
 * ```
 *
 * @param options - 配置选项（表单初始值、校验规则）
 * @returns modal - 响应式弹窗状态（visibleByView/visibleByEdit/title/form/confirmLoading）
 * @returns formCtl - Form.useForm 返回的表单控制器（validate/resetFields/validateInfos）
 * @returns setForm - 设置表单数据（合并到 modal.form）
 * @returns resetForm - 重置表单校验状态和值
 * @returns close - 关闭弹窗并重置表单
 */
export function useCrudModal<TForm extends Record<string, any>>(
  options: UseCrudModalOptions<TForm>
) {
  const { initForm, rules } = options;

  /** 响应式弹窗状态 */
  const modal = reactive({
    /** 详情弹窗是否可见 */
    visibleByView: false,
    /** 编辑弹窗是否可见 */
    visibleByEdit: false,
    /** 弹窗标题 */
    title: '',
    /** 表单数据 */
    form: initForm(),
    /** 确定按钮 loading 状态 */
    confirmLoading: false,
  });

  /** 表单控制器（ant-design-vue Form.useForm） */
  const formCtl = Form.useForm(
    modal.form as Record<string, any>,
    rules ? reactive(rules) : undefined
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

  return {
    modal,
    formCtl,
    setForm,
    resetForm,
    close,
  };
}
