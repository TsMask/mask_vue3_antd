import { ref, type Ref } from 'vue';
import { message, Modal } from 'antdv-next';
import { isSuccess, type ResultType } from '@/api/httpClient';

/** 直接执行操作的配置 */
export interface ExecuteActionOptions {
  /** 实际业务请求；参数通过闭包捕获 */
  action: () => Promise<ResultType>;
  /** 操作成功提示；不传则不提示 */
  successText?: string;
  /** 全局 loading 提示；false 表示只维护按钮 loading */
  loadingText?: string | false;
  /** 操作成功回调，通常用于关闭弹窗、刷新列表 */
  onSuccess?: (res: ResultType) => void;
  /** 请求异常回调；业务失败码不走这里 */
  onError?: (error: Error) => void;
}

/** 二次确认操作的配置 */
export interface ConfirmActionOptions
  extends Omit<ExecuteActionOptions, 'loadingText'> {
  /** 确认框标题 */
  title?: string;
  /** 确认框内容 */
  content: string;
  /** 取消确认回调，例如状态开关回滚 */
  onCancel?: () => void;
}

export interface UseModalActionResult {
  /** 直接执行动作；返回 true 表示业务成功 */
  executeAction: (options: ExecuteActionOptions) => Promise<boolean>;
  /** 打开确认框，确认后复用 executeAction 执行 */
  confirmAction: (options: ConfirmActionOptions) => void;
  /** 当前实例的动作是否执行中 */
  loading: Ref<boolean>;
}

/**
 * 统一操作反馈 Hook。
 *
 * executeAction 用于表单提交、弹窗确认等直接动作；
 * confirmAction 用于删除、清空、强退等二次确认动作。
 */
export function useModalAction(): UseModalActionResult {
  const loading = ref(false);

  async function executeAction(
    options: ExecuteActionOptions
  ): Promise<boolean> {
    if (loading.value) return false;

    const {
      action,
      successText,
      loadingText = '请稍等...',
      onSuccess,
      onError,
    } = options;

    loading.value = true;
    const hide =
      loadingText === false ? undefined : message.loading(loadingText, 0);

    try {
      const res = await action();
      hide?.();

      if (!isSuccess(res)) {
        message.error({ content: res.msg || '操作失败', duration: 3 });
        return false;
      }

      if (successText) {
        message.success({ content: successText, duration: 3 });
      }
      onSuccess?.(res);
      return true;
    } catch (error: any) {
      hide?.();
      message.error({ content: error?.message || '操作失败', duration: 3 });
      onError?.(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function confirmAction(options: ConfirmActionOptions) {
    const {
      title = '提示',
      content,
      action,
      successText,
      onSuccess,
      onError,
      onCancel,
    } = options;

    Modal.confirm({
      title,
      content,
      onOk() {
        return executeAction({
          action,
          successText,
          loadingText: false,
          onSuccess,
          onError,
        });
      },
      onCancel,
    });
  }

  return { executeAction, confirmAction, loading };
}
