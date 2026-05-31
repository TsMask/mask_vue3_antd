import { ref, type Ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { isSuccess } from '@/plugins/http-fetch';
import type { ResultType } from '@/plugins/http-fetch';

/**
 * 带反馈的增删改操作配置项
 *
 * @template TVariables - 操作的输入参数类型
 */
export interface UseActionOptions<TVariables = void> {
  /**
   * 执行实际业务操作的函数
   * 例: (data) => addUser(data)
   */
  action: (variables: TVariables) => Promise<ResultType>;
  /**
   * 操作成功后的提示文本
   * 不传则不显示成功提示
   */
  successText?: string;
  /**
   * 操作进行中的提示文本
   * 默认 "请稍等..."
   */
  loadingText?: string;
  /**
   * 操作成功后的回调
   * 在成功提示之后执行，通常用于关闭弹窗、刷新列表
   */
  onSuccess?: (res: ResultType, variables: TVariables) => void;
  /**
   * 操作失败后的回调
   */
  onError?: (error: Error, variables: TVariables) => void;
}

/** 带反馈的增删改操作结果 */
export interface UseActionResult<TVariables = void> {
  /**
   * 执行操作
   * 自动显示 loading 提示，根据结果显示成功/失败消息，调用 onSuccess/onError 回调
   */
  execute: (variables: TVariables) => Promise<ResultType | undefined>;
  /** 是否正在执行 */
  loading: Ref<boolean>;
}

/**
 * 带反馈的增删改操作 hook（纯 Vue 实现）
 *
 * 封装 loading 提示、成功/失败消息反馈。
 * 操作成功后通过 onSuccess 回调让页面自行决定后续行为（如刷新列表）。
 *
 * @example
 * ```ts
 * const { execute: submit, loading: isSubmitting } = useAction({
 *   action: (form) => form.id ? updateUser(form) : addUser(form),
 *   successText: '操作成功',
 *   onSuccess() {
 *     handleCancel();
 *     fetchList();
 *   },
 * });
 *
 * // 提交时调用
 * await submit(toRaw(form));
 * ```
 */
export function useAction<TVariables = void>(
  options: UseActionOptions<TVariables>
): UseActionResult<TVariables> {
  const {
    action,
    successText,
    loadingText = '请稍等...',
    onSuccess,
    onError,
  } = options;

  const loading = ref(false);

  async function execute(variables: TVariables): Promise<ResultType | undefined> {
    loading.value = true;
    const hide = message.loading(loadingText, 0);
    try {
      const res = await action(variables);
      hide();
      if (isSuccess(res)) {
        if (successText) {
          message.success({ content: successText, duration: 3 });
        }
        onSuccess?.(res, variables);
        return res;
      } else {
        message.error({ content: res.msg || '操作失败', duration: 3 });
        return undefined;
      }
    } catch (error: any) {
      hide();
      message.error({ content: error.message || '操作失败', duration: 3 });
      onError?.(error, variables);
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  return { execute, loading };
}

/** 二次确认后执行操作的配置项 */
export interface ConfirmActionOptions<TVariables = void> {
  /** 确认框标题，默认 "提示" */
  title?: string;
  /** 确认框内容文本 */
  content: string;
  /** 确认后执行的操作函数 */
  action: (variables: TVariables) => Promise<ResultType>;
  /** 操作变量 */
  variables: TVariables;
  /** 操作成功后的提示文本 */
  successText?: string;
  /** 操作成功后的回调，通常用于刷新列表 */
  onSuccess?: (res: ResultType) => void;
}

/**
 * 二次确认后执行操作
 *
 * 弹出确认对话框，确认后自动执行操作并显示 loading/成功/失败提示。
 * 适用于删除、清空、强退等危险操作。
 *
 * @example
 * ```ts
 * confirmAction({
 *   content: `确认删除用户编号为 【${userId}】 的数据项?`,
 *   action: (id) => delUser(id),
 *   variables: userId,
 *   successText: '删除成功',
 *   onSuccess() {
 *     clampPage(1);
 *     fetchList();
 *   },
 * });
 * ```
 */
export function confirmAction<TVariables = void>(
  options: ConfirmActionOptions<TVariables>
) {
  const {
    title = '提示',
    content,
    action,
    variables,
    successText,
    onSuccess,
  } = options;

  Modal.confirm({
    title,
    content,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      return action(variables)
        .then(res => {
          hide();
          if (isSuccess(res)) {
            if (successText) {
              message.success({ content: successText, duration: 3 });
            }
            onSuccess?.(res);
          } else {
            message.error({ content: res.msg || '操作失败', duration: 3 });
          }
        })
        .catch(error => {
          hide();
          message.error({ content: error.message || '操作失败', duration: 3 });
        });
    },
  });
}
