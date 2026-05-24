import { useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query';
import { message, Modal } from 'ant-design-vue';
import { isSuccess } from '@/plugins/http-fetch';
import type { ResultType } from '@/plugins/http-fetch';

/** mutation 操作过程中传递的上下文类型 */
interface MutationContext {
  /** 关闭全局 loading 提示的函数 */
  hide: () => void;
}

/**
 * Mutation 操作配置项
 *
 * @template TVariables - mutation 的输入参数类型
 */
export interface UseMutationActionOptions<TVariables = void> {
  /**
   * 执行实际业务操作的函数
   * 例: (data) => addUser(data)
   */
  mutationFn: (variables: TVariables) => Promise<ResultType>;
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
   * 操作成功后需要失效的 queryKey 列表
   * 会自动调用 queryClient.invalidateQueries 刷新对应缓存
   * 例: [['userList']] 或 [['userList'], ['deptTree']]
   */
  invalidateKeys?: QueryKey[];
  /**
   * 操作成功后的额外回调
   * 在成功提示之后、失效缓存之前执行
   */
  onSuccess?: (res: ResultType, variables: TVariables) => void;
  /**
   * 操作失败后的额外回调
   */
  onError?: (error: Error, variables: TVariables) => void;
}

/** Mutation 操作结果 */
export interface UseMutationActionResult<TVariables = void> {
  /** 执行操作（会自动显示 loading 和成功/失败提示） */
  mutate: (variables: TVariables) => void;
  /** 执行操作（Promise 版本，可 await） */
  mutateAsync: (variables: TVariables) => Promise<ResultType>;
  /** 是否正在执行 */
  isLoading: import('vue').Ref<boolean>;
  /** 重置状态 */
  reset: () => void;
  /** vue-query 原始 mutation 返回值 */
  mutation: ReturnType<typeof useMutation<ResultType, Error, TVariables>>;
}

/**
 * 带反馈的增删改操作 hook
 *
 * 封装 vue-query 的 useMutation，自动集成 loading 提示、成功/失败反馈、缓存失效。
 * 替代原来页面中手动编写的 withLoading + confirmAndRun + fetchList 模式。
 *
 * @example
 * ```ts
 * // 新增用户
 * const { mutateAsync, isLoading } = useMutationAction({
 *   mutationFn: (data) => addUser(data),
 *   successText: '新增成功',
 *   invalidateKeys: [['userList']],
 * });
 *
 * // 在提交函数中使用
 * await mutateAsync(toRaw(form));
 * closeModal();
 * ```
 */
export function useMutationAction<TVariables = void>(
  options: UseMutationActionOptions<TVariables>
): UseMutationActionResult<TVariables> {
  const {
    mutationFn,
    successText,
    loadingText = '请稍等...',
    invalidateKeys,
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();

  const mutation = useMutation<ResultType, Error, TVariables, MutationContext>({
    mutationFn,

    onMutate(): MutationContext {
      /** 显示全局 loading 提示 */
      const hide = message.loading(loadingText, 0);
      return { hide };
    },

    onSuccess(res, variables, context) {
      /** 关闭 loading */
      context?.hide();

      if (isSuccess(res)) {
        /** 显示成功提示 */
        if (successText) {
          message.success({ content: successText, duration: 3 });
        }
        /** 执行额外成功回调 */
        onSuccess?.(res, variables);
        /** 失效相关缓存，触发列表刷新 */
        if (invalidateKeys?.length) {
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        }
      } else {
        /** 业务失败，显示后端错误信息 */
        message.error({ content: res.msg || '操作失败', duration: 3 });
        onError?.(new Error(res.msg), variables);
      }
    },

    onError(error, variables, context) {
      /** 关闭 loading */
      context?.hide();
      /** 网络等异常 */
      message.error({ content: error.message || '操作失败', duration: 3 });
      onError?.(error, variables);
    },
  });

  function mutate(variables: TVariables) {
    mutation.mutate(variables);
  }

  async function mutateAsync(variables: TVariables): Promise<ResultType> {
    return mutation.mutateAsync(variables);
  }

  return {
    mutate,
    mutateAsync,
    isLoading: mutation.isPending as unknown as import('vue').Ref<boolean>,
    reset: mutation.reset,
    mutation,
  };
}

/** 二次确认后执行操作的配置项 */
export interface ConfirmAndRunOptions<TVariables = void> {
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
  /** 操作成功后需要失效的 queryKey 列表 */
  invalidateKeys?: QueryKey[];
  /** 操作成功后的额外回调 */
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
 * confirmAndRun({
 *   content: `确认删除用户编号为 【${userId}】 的数据项?`,
 *   action: (id) => delUser(id),
 *   variables: userId,
 *   successText: '删除成功',
 *   invalidateKeys: [['userList']],
 * });
 * ```
 */
export function confirmAndRun<TVariables = void>(
  options: ConfirmAndRunOptions<TVariables>
) {
  const {
    title = '提示',
    content,
    action,
    variables,
    successText,
    invalidateKeys,
    onSuccess,
  } = options;

  const queryClient = useQueryClient();

  Modal.confirm({
    title,
    content,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      return action(variables)
        .then((res) => {
          hide();
          if (isSuccess(res)) {
            if (successText) {
              message.success({ content: successText, duration: 3 });
            }
            onSuccess?.(res);
            if (invalidateKeys?.length) {
              for (const key of invalidateKeys) {
                queryClient.invalidateQueries({ queryKey: key });
              }
            }
          } else {
            message.error({ content: res.msg || '操作失败', duration: 3 });
          }
        })
        .catch((error) => {
          hide();
          message.error({ content: error.message || '操作失败', duration: 3 });
        });
    },
  });
}