import { computed, nextTick, reactive } from 'vue';
import { message, useForm, type FormInstance } from 'antdv-next';
import { isSuccess, type ResultType } from '@/api/httpClient';

/** 弹窗模式：view 详情只读 / add 新增 / edit 编辑 */
export type ModalFormMode = 'view' | 'add' | 'edit';

/** 创建 ModalForm 时需要的表单定义 */
export interface UseModalFormOptions<TForm> {
  /**
   * 表单初始值工厂。
   * 每次打开都会重新调用，避免上一次接口字段或页面修改残留在表单中。
   */
  initForm: () => TForm;
  /** Must match the name of the modal's single a-form instance. */
  formName: string;
  /** antdv-next a-form :rules 格式的校验规则 */
  rules?: Record<string, any>;
}

/** openModal 的一次完整打开配置 */
export interface OpenModalFormOptions<TForm, TData = any> {
  /** view 只读详情 / add 新增 / edit 编辑 */
  mode: ModalFormMode;
  /** 弹窗标题 */
  title: string;

  /** 详情接口；新增等无需请求数据的场景可省略 */
  fetchDetail?: () => Promise<ResultType>;

  /** 打开时的表单默认值；配置详情接口时，成功结果会覆盖同名默认值 */
  initialData?: Partial<TForm>;

  /**
   * 从详情响应中提取表单字段。
   * 返回 undefined / void 时直接使用响应 data；返回空对象可阻止详情数据写入表单。
   */
  transformDetail?: (
    data: TData
  ) => Promise<Partial<TForm> | undefined | void> | Partial<TForm> | undefined | void;

  /** 表单赋值后、弹窗展示前的扩展逻辑，可修改表单或同步树、选项等附属状态 */
  beforeOpen?: (form: TForm, data?: TData) => Promise<void> | void;

  /** 详情加载文案；传 false 关闭全局 loading */
  loadingText?: string | false;

  /** 详情获取或初始化失败提示；传 false 关闭错误提示 */
  errorMessage?: string | false;
}

/**
 * 通用表单弹窗管理（单弹窗 + 模式驱动）。
 *
 * 页面只维护一份字段布局；打开、请求详情、表单恢复和错误反馈由
 * openModal 统一编排。复杂页面把树、选项等附属状态放入 beforeOpen。
 */
export function useModalForm<TForm extends Record<string, any>>(
  options: UseModalFormOptions<TForm>
) {
  const { initForm, rules, formName } = options;

  /** 弹窗与表单共享的响应式状态，form 引用在 Hook 生命周期内保持不变 */
  const modal = reactive({
    /** 当前交互模式 */
    mode: 'add' as ModalFormMode,
    /** 弹窗展示标记，直接绑定到 Modal 的 open */
    visible: false,
    /** 弹窗标题 */
    title: '',
    /** 唯一表单数据源 */
    form: initForm(),
    /** 详情初始化中；提交 loading 由操作 Hook 返回的 loading 负责 */
    opening: false,
  });

  /** 校验状态与校验规则控制器 */
  const formRules = rules ? reactive(rules) : undefined;

  // antdv-next connects a form hook to a descendant form by its name.
  const formInstance = useForm(formName);

  // Compatibility layer for the legacy Form.useForm controller. Validation
  // feedback is handled by a-form-item itself, so validateInfos binds empty
  // objects to keep existing v-bind="formCtl.validateInfos.xxx" templates.
  const formCtl = {
    validate: (...args: Parameters<FormInstance['validate']>) =>
      formInstance.validate(...args),
    validateFields: (...args: Parameters<FormInstance['validateFields']>) =>
      formInstance.validateFields(...args),
    resetFields: (...args: Parameters<FormInstance['resetFields']>) =>
      formInstance.resetFields(...args),
    clearValidate: (...args: Parameters<FormInstance['clearValidate']>) =>
      formInstance.clearValidate(...args),
    validateInfos: new Proxy({} as Record<string, any>, {
      get: () => ({}),
    }),
  };

  /** 详情模式禁用表单并允许只读字段布局复用编辑布局 */
  const isView = computed(() => modal.mode === 'view');

  /** 合并数据但不替换 form 对象，保证页面已有 form 引用继续有效 */
  function mergeForm(data: Partial<TForm>) {
    Object.assign(modal.form as Record<string, any>, data);
  }

  /**
   * 按初始值工厂整体恢复表单。
   * 不依赖当前是否已有 Form.Item 挂载，也不会保留上一次接口带来的多余字段。
   */
  function resetForm() {
    const form = modal.form as Record<string, any>;
    Object.keys(form).forEach((key) => delete form[key]);
    Object.assign(form, initForm());
  }

  /** 恢复初始值后合并传入数据，用于复用同一表单的独立弹窗 */
  function replaceForm(data: Partial<TForm>) {
    resetForm();
    mergeForm(data);
  }

  /**
   * 打开表单弹窗。
   *
   * 执行顺序：恢复初始值 -> 合并 initialData -> 请求详情 -> transformDetail
   * -> beforeOpen -> 展示弹窗。任一请求或初始化环节失败都不会展示弹窗。
   *
   * @returns 是否成功打开；重复点击或已打开时返回 false。
   */
  async function openModal<TData = any>(
    openOptions: OpenModalFormOptions<TForm, TData>
  ): Promise<boolean> {
    if (modal.opening || modal.visible) return false;

    modal.opening = true;
    const hide =
      openOptions.fetchDetail && openOptions.loadingText !== false
        ? message.loading(openOptions.loadingText || '正在打开...', 0)
        : undefined;

    try {
      resetForm();

      if (openOptions.initialData) {
        mergeForm(openOptions.initialData);
      }

      let data: TData | undefined;
      if (openOptions.fetchDetail) {
        const res = await openOptions.fetchDetail();
        if (!isSuccess(res) || res.data === null || res.data === undefined) {
          if (openOptions.errorMessage !== false) {
            message.error(openOptions.errorMessage || '获取详情失败');
          }
          return false;
        }

        data = res.data as TData;
        const transformed = await openOptions.transformDetail?.(data);
        mergeForm((transformed ?? data) as Partial<TForm>);
      }

      await openOptions.beforeOpen?.(modal.form as TForm, data);
      modal.mode = openOptions.mode;
      modal.title = openOptions.title;
      modal.visible = true;
      await nextTick();
      formCtl.clearValidate();
      return true;
    } catch {
      if (openOptions.errorMessage !== false) {
        message.error(
          openOptions.errorMessage ||
            (openOptions.fetchDetail ? '获取详情失败' : '初始化表单失败')
        );
      }
      return false;
    } finally {
      hide?.();
      modal.opening = false;
    }
  }

  /** 关闭弹窗并恢复下一次打开所需的干净表单 */
  function closeModal() {
    if (modal.visible) formCtl.clearValidate();
    modal.visible = false;
    resetForm();
  }

  return {
    modal,
    formCtl,
    rules: formRules,
    isView,
    replaceForm,
    resetForm,
    openModal,
    closeModal,
  };
}
