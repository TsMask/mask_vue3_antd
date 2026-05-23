import { message, Modal } from "ant-design-vue";
import { RESULT_CODE_SUCCESS } from "@/constants/result-constants";

/** 带 loading 提示的异步操作配置项 */
export interface WithLoadingOptions {
  /** 加载中提示文本，默认 "请稍等..." */
  loadingText?: string;
  /** 成功后提示文本，不传则不显示成功提示 */
  successText?: string;
  /** 提示持续时间（秒），默认 3 */
  duration?: number;
}

/**
 * 通用操作反馈 hook
 *
 * 解决的问题：
 * - 各页面重复编写 message.loading / message.success / message.error 弹出模式
 * - 删除、清空等危险操作需要 Modal.confirm 二次确认，逻辑散落各处
 * - confirmLoading 状态管理不统一
 *
 * @example
 * ```ts
 * const { withLoading, confirmAndRun } = useMessageAction();
 *
 * // 带 loading 反馈的异步操作
 * const res = await withLoading(addPost(form), { successText: '新增成功' });
 *
 * // 二次确认 + 操作
 * confirmAndRun({
 *   content: '确认删除岗位编号为【1】的数据项?',
 *   onOk: () => delPost('1'),
 *   successText: '删除成功',
 *   onSuccess: () => fetchList(),
 * });
 * ```
 */
export function useMessageAction() {
  /**
   * 带 loading 提示的异步操作包装
   * 自动显示 loading、成功/失败提示，返回原始响应供调用方判断
   *
   * @param promise - 需要包装的异步操作（通常为 API 调用）
   * @param options - 提示配置选项
   * @returns 原始 API 响应对象
   */
  async function withLoading<T = any>(
    promise: Promise<T>,
    options: WithLoadingOptions = {},
  ): Promise<T> {
    const { loadingText = "请稍等...", successText, duration = 3 } = options;
    const hide = message.loading(loadingText, 0);

    try {
      const res: any = await promise;
      if (res.code === RESULT_CODE_SUCCESS) {
        if (successText) {
          message.success({ content: successText, duration });
        }
      } else {
        message.error({ content: res.msg, duration });
      }
      return res;
    } finally {
      hide();
    }
  }

  /**
   * 二次确认后执行操作
   * 弹出 Modal.confirm 确认框，确认后自动包装 withLoading 执行操作
   *
   * @param options.title - 确认框标题，默认 "提示"
   * @param options.content - 确认框内容文本
   * @param options.onOk - 确认后执行的异步操作
   * @param options.successText - 操作成功后提示文本
   * @param options.onSuccess - 操作成功后额外回调（如刷新列表）
   */
  function confirmAndRun(options: {
    title?: string;
    content: string;
    onOk: () => Promise<any>;
    successText?: string;
    onSuccess?: (res: any) => void;
  }) {
    const { title = "提示", content, onOk, successText, onSuccess } = options;
    Modal.confirm({
      title,
      content,
      onOk() {
        return withLoading(onOk(), { successText }).then((res) => {
          if (res.code === RESULT_CODE_SUCCESS) {
            onSuccess?.(res);
          }
        });
      },
    });
  }

  return {
    withLoading,
    confirmAndRun,
  };
}
